package handlers

import (
	"time"

	"cybercafe-backend/internal/config"
	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewDashboardHandler(db *gorm.DB, cfg *config.Config) *DashboardHandler {
	return &DashboardHandler{
		db:  db,
		cfg: cfg,
	}
}

// EmployeeDashboardData represents the response structure for employee dashboard
type EmployeeDashboardData struct {
	TodayAttendance   *TodayAttendanceData   `json:"today_attendance"`
	MealAllowance     *MealAllowanceData     `json:"meal_allowance"`
	MonthlyStats      *MonthlyStatsData      `json:"monthly_stats"`
	RecentActivities  []RecentActivityData   `json:"recent_activities"`
}

type TodayAttendanceData struct {
	CheckedIn    bool      `json:"checked_in"`
	CheckedOut   bool      `json:"checked_out"`
	CheckInTime  *time.Time `json:"check_in_time"`
	CheckOutTime *time.Time `json:"check_out_time"`
	WorkingHours float64   `json:"working_hours"`
	Status       string    `json:"status"`
}

type MealAllowanceData struct {
	TotalAmount     float64 `json:"total_amount"`
	UsedAmount      float64 `json:"used_amount"`
	RemainingAmount float64 `json:"remaining_amount"`
	AttendanceCount int     `json:"attendance_count"`
	CanClaim        bool    `json:"can_claim"`
	ClaimStatus     string  `json:"claim_status"`
}

type MonthlyStatsData struct {
	TotalWorkingDays int     `json:"total_working_days"`
	PresentDays      int     `json:"present_days"`
	AbsentDays       int     `json:"absent_days"`
	LateDays         int     `json:"late_days"`
	AttendanceRate   float64 `json:"attendance_rate"`
	AverageWorkHours float64 `json:"average_work_hours"`
}

type RecentActivityData struct {
	Date        time.Time `json:"date"`
	CheckIn     *time.Time `json:"check_in"`
	CheckOut    *time.Time `json:"check_out"`
	WorkHours   float64   `json:"work_hours"`
	Status      string    `json:"status"`
}

// GetEmployeeDashboard returns comprehensive dashboard data for employee
func (h *DashboardHandler) GetEmployeeDashboard(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	// Get today's attendance
	todayAttendance := h.getTodayAttendance(userID)

	// Get meal allowance data
	mealAllowance := h.getMealAllowanceData(userID, currentMonth, currentYear)

	// Get monthly statistics
	monthlyStats := h.getMonthlyStats(userID, currentMonth, currentYear)

	// Get recent activities (last 7 days)
	recentActivities := h.getRecentActivities(userID, 7)

	dashboardData := EmployeeDashboardData{
		TodayAttendance:  todayAttendance,
		MealAllowance:    mealAllowance,
		MonthlyStats:     monthlyStats,
		RecentActivities: recentActivities,
	}

	return utils.SuccessResponse(c, "Employee dashboard data retrieved successfully", dashboardData)
}

func (h *DashboardHandler) getTodayAttendance(userID uuid.UUID) *TodayAttendanceData {
	today := time.Now().Format("2006-01-02")
	var attendance models.Attendance

	err := h.db.Where("user_id = ? AND DATE(check_in_time) = ?", userID, today).First(&attendance).Error
	if err != nil {
		return &TodayAttendanceData{
			CheckedIn:    false,
			CheckedOut:   false,
			WorkingHours: 0,
			Status:       "not_checked_in",
		}
	}

	workingHours := 0.0
	status := "checked_in"

	if attendance.CheckOutTime != nil {
		status = "checked_out"
		workingHours = attendance.CheckOutTime.Sub(attendance.CheckInTime).Hours()
	}

	return &TodayAttendanceData{
		CheckedIn:    true,
		CheckedOut:   attendance.CheckOutTime != nil,
		CheckInTime:  &attendance.CheckInTime,
		CheckOutTime: attendance.CheckOutTime,
		WorkingHours: workingHours,
		Status:       status,
	}
}

func (h *DashboardHandler) getMealAllowanceData(userID uuid.UUID, month, year int) *MealAllowanceData {
	// Get meal allowance policy
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		return &MealAllowanceData{
			TotalAmount:     0,
			UsedAmount:      0,
			RemainingAmount: 0,
			AttendanceCount: 0,
			CanClaim:        false,
			ClaimStatus:     "no_policy",
		}
	}

	// Get attendance count for the month
	_, validAttendance := models.GetValidAttendanceCount(h.db, userID, month, year)

	// Calculate total amount based on valid attendance
	totalAmount := float64(validAttendance) * policy.AmountPerDay

	// Check existing claim
	var claim models.MealAllowanceClaim
	usedAmount := 0.0
	claimStatus := "not_claimed"
	canClaim := models.CanUserClaim(h.db, userID, month, year) && validAttendance > 0

	if err := h.db.Where("user_id = ? AND month = ? AND year = ?", userID, month, year).First(&claim).Error; err == nil {
		usedAmount = claim.TotalAmount
		claimStatus = claim.Status
		canClaim = false // Already claimed
	}

	return &MealAllowanceData{
		TotalAmount:     totalAmount,
		UsedAmount:      usedAmount,
		RemainingAmount: totalAmount - usedAmount,
		AttendanceCount: validAttendance,
		CanClaim:        canClaim,
		ClaimStatus:     claimStatus,
	}
}

func (h *DashboardHandler) getMonthlyStats(userID uuid.UUID, month, year int) *MonthlyStatsData {
	// Get all attendance for the month
	var attendances []models.Attendance
	h.db.Where("user_id = ? AND EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ?", 
		userID, month, year).Find(&attendances)

	presentDays := len(attendances)
	lateDays := 0
	totalWorkHours := 0.0

	for _, att := range attendances {
		// Check if late (after 9:00 AM)
		if att.CheckInTime.Hour() > 9 || (att.CheckInTime.Hour() == 9 && att.CheckInTime.Minute() > 0) {
			lateDays++
		}

		// Calculate work hours
		if att.CheckOutTime != nil {
			totalWorkHours += att.CheckOutTime.Sub(att.CheckInTime).Hours()
		}
	}

	// Calculate total working days in month (assuming 22 working days)
	totalWorkingDays := 22
	absentDays := totalWorkingDays - presentDays
	attendanceRate := float64(presentDays) / float64(totalWorkingDays) * 100
	averageWorkHours := 0.0
	if presentDays > 0 {
		averageWorkHours = totalWorkHours / float64(presentDays)
	}

	return &MonthlyStatsData{
		TotalWorkingDays: totalWorkingDays,
		PresentDays:      presentDays,
		AbsentDays:       absentDays,
		LateDays:         lateDays,
		AttendanceRate:   attendanceRate,
		AverageWorkHours: averageWorkHours,
	}
}

func (h *DashboardHandler) getRecentActivities(userID uuid.UUID, days int) []RecentActivityData {
	var attendances []models.Attendance
	startDate := time.Now().AddDate(0, 0, -days)

	h.db.Where("user_id = ? AND check_in_time >= ?", userID, startDate).
		Order("check_in_time DESC").Find(&attendances)

	var activities []RecentActivityData
	for _, att := range attendances {
		workHours := 0.0
		status := "present"

		if att.CheckOutTime != nil {
			workHours = att.CheckOutTime.Sub(att.CheckInTime).Hours()
			if workHours < 8 {
				status = "early_leave"
			}
		} else {
			status = "not_checked_out"
		}

		// Check if late
		if att.CheckInTime.Hour() > 9 || (att.CheckInTime.Hour() == 9 && att.CheckInTime.Minute() > 0) {
			status = "late"
		}

		activity := RecentActivityData{
			Date:      time.Date(att.CheckInTime.Year(), att.CheckInTime.Month(), att.CheckInTime.Day(), 0, 0, 0, 0, time.Local),
			CheckIn:   &att.CheckInTime,
			CheckOut:  att.CheckOutTime,
			WorkHours: workHours,
			Status:    status,
		}

		activities = append(activities, activity)
	}

	return activities
}

// GetEmployeeSummary returns a quick summary for employee dashboard
func (h *DashboardHandler) GetEmployeeSummary(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	// Get today's attendance status
	today := now.Format("2006-01-02")
	var todayAttendance models.Attendance
	checkedIn := false
	checkedOut := false

	if err := h.db.Where("user_id = ? AND DATE(check_in_time) = ?", userID, today).First(&todayAttendance).Error; err == nil {
		checkedIn = true
		checkedOut = todayAttendance.CheckOutTime != nil
	}

	// Get this month's attendance count
	_, validAttendance := models.GetValidAttendanceCount(h.db, userID, currentMonth, currentYear)

	// Get meal allowance info
	var policy models.MealAllowancePolicy
	mealAllowanceAmount := 0.0
	if err := h.db.Where("is_active = true").First(&policy).Error; err == nil {
		mealAllowanceAmount = float64(validAttendance) * policy.AmountPerDay
	}

	summary := map[string]interface{}{
		"today": map[string]interface{}{
			"checked_in":  checkedIn,
			"checked_out": checkedOut,
			"date":        today,
		},
		"this_month": map[string]interface{}{
			"attendance_count":     validAttendance,
			"meal_allowance_total": mealAllowanceAmount,
			"month":                currentMonth,
			"year":                 currentYear,
		},
	}

	return utils.SuccessResponse(c, "Employee summary retrieved successfully", summary)
}