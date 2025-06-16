package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"cybercafe_management/internal/config"
	"cybercafe_management/internal/models"
	"cybercafe_management/internal/utils"
)

type AttendanceDashboardHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAttendanceDashboardHandler(db *gorm.DB, cfg *config.Config) *AttendanceDashboardHandler {
	return &AttendanceDashboardHandler{
		db:  db,
		cfg: cfg,
	}
}

// GetTodayDashboard returns real-time today's attendance data
func (h *AttendanceDashboardHandler) GetTodayDashboard(c *fiber.Ctx) error {
	today := time.Now().Format("2006-01-02")

	// Get all staff (non-admin)
	var staff []models.User
	if err := h.db.Preload("Role").Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name != 'admin'").Find(&staff).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch staff", err)
	}

	// Get today's attendance records
	var todayAttendance []models.Attendance
	if err := h.db.Preload("User").Where("DATE(check_in_time) = ?", today).Find(&todayAttendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch today's attendance", err)
	}

	// Create attendance map for quick lookup
	attendanceMap := make(map[uuid.UUID]*models.Attendance)
	for i := range todayAttendance {
		attendanceMap[todayAttendance[i].UserID] = &todayAttendance[i]
	}

	// Calculate stats
	totalStaff := len(staff)
	presentCount := 0
	lateCount := 0
	checkedOutCount := 0

	// Process each staff member
	var staffWithStatus []map[string]interface{}
	for _, s := range staff {
		attendance, hasAttendance := attendanceMap[s.ID]
		staffData := map[string]interface{}{
			"id":        s.ID,
			"name":      s.Name,
			"full_name": s.FullName,
			"email":     s.Email,
		}

		if hasAttendance {
			presentCount++
			checkInTime := attendance.CheckInTime
			workStart := time.Date(checkInTime.Year(), checkInTime.Month(), checkInTime.Day(), 9, 0, 0, 0, checkInTime.Location())
			isLate := checkInTime.After(workStart)

			if isLate {
				lateCount++
			}

			if attendance.CheckOutTime != nil {
				checkedOutCount++
				staffData["status"] = "checked_out"
				staffData["check_out_time"] = attendance.CheckOutTime
			} else {
				staffData["status"] = "checked_in"
			}

			staffData["check_in_time"] = attendance.CheckInTime
			staffData["is_late"] = isLate
			staffData["address"] = attendance.Address
			staffData["notes"] = attendance.Notes
		} else {
			staffData["status"] = "absent"
			staffData["is_late"] = false
		}

		staffWithStatus = append(staffWithStatus, staffData)
	}

	absentCount := totalStaff - presentCount

	stats := map[string]interface{}{
		"present":     presentCount,
		"absent":      absentCount,
		"late":        lateCount,
		"checked_out": checkedOutCount,
		"total":       totalStaff,
		"date":        today,
	}

	response := map[string]interface{}{
		"stats":           stats,
		"staff":           staffWithStatus,
		"recent_activity": todayAttendance,
		"type":            "today",
	}

	return utils.SuccessResponse(c, "Today's dashboard data retrieved successfully", response)
}

// GetMonthlyDashboard returns monthly recap attendance data
func (h *AttendanceDashboardHandler) GetMonthlyDashboard(c *fiber.Ctx) error {
	month := c.Query("month", time.Now().Format("2006-01"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")

	offset := (page - 1) * limit

	// Get all staff (non-admin)
	var staff []models.User
	staffQuery := h.db.Preload("Role").Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name != 'admin'")
	if search != "" {
		staffQuery = staffQuery.Where("users.name ILIKE ? OR users.full_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if err := staffQuery.Find(&staff).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch staff", err)
	}

	// Get monthly attendance records
	var monthlyAttendance []models.Attendance
	if err := h.db.Preload("User").Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month).Find(&monthlyAttendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch monthly attendance", err)
	}

	// Group attendance by user
	userAttendanceMap := make(map[uuid.UUID][]models.Attendance)
	for _, attendance := range monthlyAttendance {
		userAttendanceMap[attendance.UserID] = append(userAttendanceMap[attendance.UserID], attendance)
	}

	// Calculate monthly stats for each staff
	var staffMonthlyData []map[string]interface{}
	totalPresent := 0
	totalLate := 0
	totalAbsent := 0

	for _, s := range staff {
		userAttendances := userAttendanceMap[s.ID]
		presentDays := len(userAttendances)
		lateDays := 0
		totalWorkingHours := 0.0

		for _, attendance := range userAttendances {
			checkInTime := attendance.CheckInTime
			workStart := time.Date(checkInTime.Year(), checkInTime.Month(), checkInTime.Day(), 9, 0, 0, 0, checkInTime.Location())
			if checkInTime.After(workStart) {
				lateDays++
			}

			if attendance.CheckOutTime != nil {
				totalWorkingHours += attendance.CheckOutTime.Sub(attendance.CheckInTime).Hours()
			}
		}

		// Calculate working days in month
		monthTime, _ := time.Parse("2006-01", month)
		workingDays := getWorkingDaysInMonth(monthTime)
		absentDays := workingDays - presentDays

		totalPresent += presentDays
		totalLate += lateDays
		totalAbsent += absentDays

		staffData := map[string]interface{}{
			"id":                s.ID,
			"name":              s.Name,
			"full_name":         s.FullName,
			"email":             s.Email,
			"present_days":      presentDays,
			"absent_days":       absentDays,
			"late_days":         lateDays,
			"working_days":      workingDays,
			"total_working_hours": totalWorkingHours,
			"attendance_rate":   float64(presentDays) / float64(workingDays) * 100,
		}

		staffMonthlyData = append(staffMonthlyData, staffData)
	}

	// Pagination
	totalStaff := len(staffMonthlyData)
	start := offset
	end := offset + limit
	if end > totalStaff {
		end = totalStaff
	}
	if start > totalStaff {
		start = totalStaff
	}

	paginatedStaff := staffMonthlyData[start:end]

	// Get recent attendance for the month
	var recentAttendance []models.Attendance
	if err := h.db.Preload("User").Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month).Order("check_in_time DESC").Limit(10).Find(&recentAttendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch recent attendance", err)
	}

	stats := map[string]interface{}{
		"total_present": totalPresent,
		"total_absent":  totalAbsent,
		"total_late":    totalLate,
		"total_staff":   len(staff),
		"month":         month,
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      int64(totalStaff),
		TotalPages: int((int64(totalStaff) + int64(limit) - 1) / int64(limit)),
	}

	response := map[string]interface{}{
		"stats":           stats,
		"staff":           paginatedStaff,
		"recent_activity": recentAttendance,
		"type":            "monthly",
		"meta":            meta,
	}

	return utils.PaginatedSuccessResponse(c, "Monthly dashboard data retrieved successfully", response, meta)
}

// GetSpecificDateDashboard returns attendance data for a specific date
func (h *AttendanceDashboardHandler) GetSpecificDateDashboard(c *fiber.Ctx) error {
	date := c.Query("date", time.Now().Format("2006-01-02"))

	// Validate date format
	if _, err := time.Parse("2006-01-02", date); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid date format. Use YYYY-MM-DD", err)
	}

	// Get all staff (non-admin)
	var staff []models.User
	if err := h.db.Preload("Role").Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name != 'admin'").Find(&staff).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch staff", err)
	}

	// Get attendance records for specific date
	var dateAttendance []models.Attendance
	if err := h.db.Preload("User").Where("DATE(check_in_time) = ?", date).Find(&dateAttendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch date attendance", err)
	}

	// Create attendance map for quick lookup
	attendanceMap := make(map[uuid.UUID]*models.Attendance)
	for i := range dateAttendance {
		attendanceMap[dateAttendance[i].UserID] = &dateAttendance[i]
	}

	// Calculate stats
	totalStaff := len(staff)
	presentCount := 0
	lateCount := 0
	checkedOutCount := 0

	// Process each staff member
	var staffWithStatus []map[string]interface{}
	for _, s := range staff {
		attendance, hasAttendance := attendanceMap[s.ID]
		staffData := map[string]interface{}{
			"id":        s.ID,
			"name":      s.Name,
			"full_name": s.FullName,
			"email":     s.Email,
		}

		if hasAttendance {
			presentCount++
			checkInTime := attendance.CheckInTime
			workStart := time.Date(checkInTime.Year(), checkInTime.Month(), checkInTime.Day(), 9, 0, 0, 0, checkInTime.Location())
			isLate := checkInTime.After(workStart)

			if isLate {
				lateCount++
			}

			if attendance.CheckOutTime != nil {
				checkedOutCount++
				staffData["status"] = "checked_out"
				staffData["check_out_time"] = attendance.CheckOutTime
			} else {
				staffData["status"] = "checked_in"
			}

			staffData["check_in_time"] = attendance.CheckInTime
			staffData["is_late"] = isLate
			staffData["address"] = attendance.Address
			staffData["notes"] = attendance.Notes
		} else {
			staffData["status"] = "absent"
			staffData["is_late"] = false
		}

		staffWithStatus = append(staffWithStatus, staffData)
	}

	absentCount := totalStaff - presentCount

	stats := map[string]interface{}{
		"present":     presentCount,
		"absent":      absentCount,
		"late":        lateCount,
		"checked_out": checkedOutCount,
		"total":       totalStaff,
		"date":        date,
	}

	response := map[string]interface{}{
		"stats":           stats,
		"staff":           staffWithStatus,
		"recent_activity": dateAttendance,
		"type":            "specific_date",
	}

	return utils.SuccessResponse(c, "Specific date dashboard data retrieved successfully", response)
}

// Helper function to calculate working days in a month (excluding weekends)
func getWorkingDaysInMonth(month time.Time) int {
	year, monthNum, _ := month.Date()
	firstDay := time.Date(year, monthNum, 1, 0, 0, 0, 0, month.Location())
	lastDay := firstDay.AddDate(0, 1, -1)

	workingDays := 0
	for d := firstDay; d.Before(lastDay.AddDate(0, 0, 1)); d = d.AddDate(0, 0, 1) {
		if d.Weekday() != time.Saturday && d.Weekday() != time.Sunday {
			workingDays++
		}
	}

	return workingDays
}