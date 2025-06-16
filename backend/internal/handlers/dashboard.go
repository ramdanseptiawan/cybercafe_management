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

// AdminDashboardData represents the response structure for admin dashboard
type AdminDashboardData struct {
	AttendanceStats    *AdminAttendanceStats    `json:"attendance_stats"`
	MealAllowanceStats *AdminMealAllowanceStats `json:"meal_allowance_stats"`
	RecentAttendance   []AdminRecentAttendance  `json:"recent_attendance"`
	MonthlySummary     *AdminMonthlySummary     `json:"monthly_summary"`
}

type AdminAttendanceStats struct {
	TodayPresent     int     `json:"today_present"`
	TotalEmployees   int     `json:"total_employees"`
	AttendanceRate   float64 `json:"attendance_rate"`
	TodayLate        int     `json:"today_late"`
}

type AdminMealAllowanceStats struct {
	TotalAmount     float64 `json:"total_amount"`
	ClaimedCount    int     `json:"claimed_count"`
	EligibleCount   int     `json:"eligible_count"`
	ClaimRate       float64 `json:"claim_rate"`
	PendingClaims   int     `json:"pending_claims"`
	ApprovedClaims  int     `json:"approved_claims"`
	RejectedClaims  int     `json:"rejected_claims"`
}

type AdminRecentAttendance struct {
	EmployeeName  string     `json:"employee_name"`
	Date          string     `json:"date"`
	CheckInTime   *time.Time `json:"check_in_time"`
	CheckOutTime  *time.Time `json:"check_out_time"`
	Status        string     `json:"status"`
}

type AdminMonthlySummary struct {
	TotalWorkingDays   int     `json:"total_working_days"`
	AttendanceRate     float64 `json:"attendance_rate"`
	AttendanceTrend    float64 `json:"attendance_trend"`
	AverageWorkHours   float64 `json:"average_work_hours"`
}

// GetAdminDashboard returns comprehensive dashboard data for admin
func (h *DashboardHandler) GetAdminDashboard(c *fiber.Ctx) error {
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()
	today := now.Format("2006-01-02")

	// Get attendance statistics
	attendanceStats := h.getAdminAttendanceStats(today)

	// Get meal allowance statistics
	mealAllowanceStats := h.getAdminMealAllowanceStats(currentMonth, currentYear)

	// Get recent attendance
	recentAttendance := h.getAdminRecentAttendance(7)

	// Get monthly summary
	monthlySummary := h.getAdminMonthlySummary(currentMonth, currentYear)

	dashboardData := AdminDashboardData{
		AttendanceStats:    attendanceStats,
		MealAllowanceStats: mealAllowanceStats,
		RecentAttendance:   recentAttendance,
		MonthlySummary:     monthlySummary,
	}

	return utils.SuccessResponse(c, "Admin dashboard data retrieved successfully", dashboardData)
}

// getAdminAttendanceStats calculates attendance statistics for admin dashboard
func (h *DashboardHandler) getAdminAttendanceStats(today string) *AdminAttendanceStats {
	// Get total employees count
	var totalEmployees int64
	h.db.Model(&models.User{}).Where("role != 'admin'").Count(&totalEmployees)

	// Get today's attendance count
	var todayPresent int64
	h.db.Model(&models.Attendance{}).Where("DATE(check_in_time) = ?", today).Count(&todayPresent)

	// Get today's late arrivals (assuming work starts at 9:00 AM)
	var todayLate int64
	h.db.Model(&models.Attendance{}).
		Where("DATE(check_in_time) = ? AND TIME(check_in_time) > '09:00:00'", today).
		Count(&todayLate)

	// Calculate attendance rate
	attendanceRate := 0.0
	if totalEmployees > 0 {
		attendanceRate = (float64(todayPresent) / float64(totalEmployees)) * 100
	}

	return &AdminAttendanceStats{
		TodayPresent:   int(todayPresent),
		TotalEmployees: int(totalEmployees),
		AttendanceRate: attendanceRate,
		TodayLate:      int(todayLate),
	}
}

// getAdminMealAllowanceStats calculates meal allowance statistics
func (h *DashboardHandler) getAdminMealAllowanceStats(month, year int) *AdminMealAllowanceStats {
	// Get active meal allowance policy
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		return &AdminMealAllowanceStats{}
	}

	// Get all employees
	var employees []models.User
	h.db.Where("role != 'admin'").Find(&employees)

	totalAmount := 0.0
	claimedCount := 0
	eligibleCount := len(employees)

	// Calculate total meal allowance for all employees this month
	for _, employee := range employees {
		_, validAttendance := models.GetValidAttendanceCount(h.db, employee.ID, month, year)
		employeeAmount := float64(validAttendance) * policy.AmountPerDay
		totalAmount += employeeAmount
		if validAttendance > 0 {
			claimedCount++
		}
	}

	// Get claim statistics (assuming there's a meal allowance claims table)
	var pendingClaims, approvedClaims, rejectedClaims int64
	// Note: These would need actual claim tables to be implemented
	// For now, we'll use placeholder values

	claimRate := 0.0
	if eligibleCount > 0 {
		claimRate = (float64(claimedCount) / float64(eligibleCount)) * 100
	}

	return &AdminMealAllowanceStats{
		TotalAmount:    totalAmount,
		ClaimedCount:   claimedCount,
		EligibleCount:  eligibleCount,
		ClaimRate:      claimRate,
		PendingClaims:  int(pendingClaims),
		ApprovedClaims: int(approvedClaims),
		RejectedClaims: int(rejectedClaims),
	}
}

// getAdminRecentAttendance gets recent attendance records for admin dashboard
func (h *DashboardHandler) getAdminRecentAttendance(days int) []AdminRecentAttendance {
	var attendances []models.Attendance
	var recentAttendance []AdminRecentAttendance

	// Get recent attendance records with user information
	h.db.Preload("User").
		Where("check_in_time >= ?", time.Now().AddDate(0, 0, -days)).
		Order("check_in_time DESC").
		Limit(10).
		Find(&attendances)

	for _, attendance := range attendances {
		status := "Hadir"
		
		// Check if late (after 9:00 AM)
		checkInTime := attendance.CheckInTime
		workStartTime := time.Date(checkInTime.Year(), checkInTime.Month(), checkInTime.Day(), 9, 0, 0, 0, checkInTime.Location())
		
		if checkInTime.After(workStartTime) {
			status = "Terlambat"
		}
		
		// Check if not checked out yet
		if attendance.CheckOutTime == nil {
			if status == "Terlambat" {
				status = "Terlambat (Belum Check Out)"
			} else {
				status = "Hadir (Belum Check Out)"
			}
		}

		recentAttendance = append(recentAttendance, AdminRecentAttendance{
			EmployeeName: attendance.User.Name,
			Date:         attendance.CheckInTime.Format("2006-01-02"),
			CheckInTime:  &attendance.CheckInTime,
			CheckOutTime: attendance.CheckOutTime,
			Status:       status,
		})
	}

	return recentAttendance
}

// getAdminMonthlySummary calculates monthly summary statistics
func (h *DashboardHandler) getAdminMonthlySummary(month, year int) *AdminMonthlySummary {
	// Calculate working days in the month (excluding weekends)
	firstDay := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	lastDay := firstDay.AddDate(0, 1, -1)
	workingDays := 0

	for d := firstDay; d.Before(lastDay) || d.Equal(lastDay); d = d.AddDate(0, 0, 1) {
		if d.Weekday() != time.Saturday && d.Weekday() != time.Sunday {
			workingDays++
		}
	}

	// Get all employees
	var employees []models.User
	h.db.Where("role != 'admin'").Find(&employees)

	totalAttendanceRate := 0.0
	totalWorkHours := 0.0
	employeeCount := len(employees)

	for _, employee := range employees {
		_, validAttendance := models.GetValidAttendanceCount(h.db, employee.ID, month, year)
		employeeRate := 0.0
		if workingDays > 0 {
			employeeRate = (float64(validAttendance) / float64(workingDays)) * 100
		}
		totalAttendanceRate += employeeRate

		// Calculate average work hours for this employee
		var attendances []models.Attendance
		h.db.Where("user_id = ? AND MONTH(check_in_time) = ? AND YEAR(check_in_time) = ? AND check_out_time IS NOT NULL",
			employee.ID, month, year).Find(&attendances)

		employeeWorkHours := 0.0
		for _, attendance := range attendances {
			if attendance.CheckOutTime != nil {
				duration := attendance.CheckOutTime.Sub(attendance.CheckInTime)
				employeeWorkHours += duration.Hours()
			}
		}
		if len(attendances) > 0 {
			totalWorkHours += employeeWorkHours / float64(len(attendances))
		}
	}

	// Calculate averages
	averageAttendanceRate := 0.0
	averageWorkHours := 0.0
	if employeeCount > 0 {
		averageAttendanceRate = totalAttendanceRate / float64(employeeCount)
		averageWorkHours = totalWorkHours / float64(employeeCount)
	}

	// Calculate trend (compare with previous month)
	prevMonth := month - 1
	prevYear := year
	if prevMonth == 0 {
		prevMonth = 12
		prevYear--
	}

	// Get previous month's attendance rate for trend calculation
	prevTotalRate := 0.0
	for _, employee := range employees {
		_, prevValidAttendance := models.GetValidAttendanceCount(h.db, employee.ID, prevMonth, prevYear)
		prevFirstDay := time.Date(prevYear, time.Month(prevMonth), 1, 0, 0, 0, 0, time.UTC)
		prevLastDay := prevFirstDay.AddDate(0, 1, -1)
		prevWorkingDays := 0
		for d := prevFirstDay; d.Before(prevLastDay) || d.Equal(prevLastDay); d = d.AddDate(0, 0, 1) {
			if d.Weekday() != time.Saturday && d.Weekday() != time.Sunday {
				prevWorkingDays++
			}
		}
		if prevWorkingDays > 0 {
			prevTotalRate += (float64(prevValidAttendance) / float64(prevWorkingDays)) * 100
		}
	}

	prevAverageRate := 0.0
	if employeeCount > 0 {
		prevAverageRate = prevTotalRate / float64(employeeCount)
	}

	attendanceTrend := averageAttendanceRate - prevAverageRate

	return &AdminMonthlySummary{
		TotalWorkingDays:   workingDays,
		AttendanceRate:     averageAttendanceRate,
		AttendanceTrend:    attendanceTrend,
		AverageWorkHours:   averageWorkHours,
	}
}