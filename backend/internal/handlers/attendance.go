package handlers

import (
	"fmt"                   // ✅ TAMBAHKAN: untuk io.Copy           // ✅ TAMBAHKAN: untuk http.DetectContentType
	"os"
	"path/filepath"
	"strconv"             // ✅ TAMBAHKAN: untuk strings.ReplaceAll
	"time"
	"log"
	"cybercafe-backend/internal/config"
	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AttendanceHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAttendanceHandler(db *gorm.DB, cfg *config.Config) *AttendanceHandler {
	return &AttendanceHandler{db: db, cfg: cfg}
}

type CheckInRequest struct {
	Latitude  float64 `json:"latitude" validate:"required"`
	Longitude float64 `json:"longitude" validate:"required"`
	Address   string  `json:"address"`
	Distance  float64 `json:"distance"`
	IsValid   bool    `json:"is_valid"`
	Notes     string  `json:"notes"`
}

func (h *AttendanceHandler) CheckIn(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	// Check if user already checked in today
	today := time.Now().Format("2006-01-02")
	var existingAttendance models.Attendance
	if err := h.db.Where("user_id = ? AND DATE(check_in_time) = ?", userID, today).First(&existingAttendance).Error; err == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Already checked in today", nil)
	}

	// Handle file upload
	file, err := c.FormFile("photo")
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Photo is required", err)
	}

	if !utils.IsValidImageFile(file.Filename) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid image file format", nil)
	}

	filename, err := utils.SaveUploadedFile(file, filepath.Join(h.cfg.UploadPath, "attendance"))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save photo", err)
	}

	// Parse form data
	latitude, _ := strconv.ParseFloat(c.FormValue("latitude"), 64)
	longitude, _ := strconv.ParseFloat(c.FormValue("longitude"), 64)
	distance, _ := strconv.ParseFloat(c.FormValue("distance"), 64)
	isValid, _ := strconv.ParseBool(c.FormValue("is_valid"))
	address := c.FormValue("address")
	notes := c.FormValue("notes")

	attendance := models.Attendance{
		UserID:      userID,
		CheckInTime: time.Now(),
		PhotoPath:   fmt.Sprintf("/uploads/attendance/%s", filename),
		Latitude:    latitude,
		Longitude:   longitude,
		Address:     address,
		Distance:    distance,
		IsValid:     isValid,
		Notes:       notes,
	}

	if err := h.db.Create(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to record check-in", err)
	}

	// Load user for response
	h.db.Preload("User").First(&attendance, attendance.ID)

	return utils.SuccessResponse(c, "Check-in recorded successfully", attendance)
}

func (h *AttendanceHandler) CheckOut(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	// Find today's attendance record
	today := time.Now().Format("2006-01-02")
	var attendance models.Attendance
	if err := h.db.Where("user_id = ? AND DATE(check_in_time) = ? AND check_out_time IS NULL", userID, today).First(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No active check-in found for today", err)
	}

	// Handle photo upload for checkout
	file, err := c.FormFile("photo")
	if err == nil && file != nil {
		// Create uploads directory if it doesn't exist
		uploadDir := "./uploads/attendance"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create upload directory", err)
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("checkout_%s_%d%s", userID.String(), time.Now().Unix(), ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveFile(file, filePath); err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save photo", err)
		}

		// ✅ PERBAIKAN: Gunakan pointer ke string
		checkoutPhotoPath := fmt.Sprintf("/uploads/attendance/%s", filename)
		attendance.CheckOutPhotoPath = &checkoutPhotoPath
	}

	// Update checkout time
	now := time.Now()
	attendance.CheckOutTime = &now

	if err := h.db.Save(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to record check-out", err)
	}

	// Load user for response
	h.db.Preload("User").First(&attendance, attendance.ID)

	return utils.SuccessResponse(c, "Check-out recorded successfully", attendance)
}

func (h *AttendanceHandler) GetMyAttendance(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	month := c.Query("month", "")
	year := c.Query("year", "")

	// Log request parameters
	log.Printf("[GET MY ATTENDANCE] Request - UserID: %s, Page: %d, Limit: %d, Month: %s, Year: %s", userID, page, limit, month, year)
	log.Printf("[GET MY ATTENDANCE] Full Query Params: %s", c.Request().URI().QueryString())

	offset := (page - 1) * limit

	query := h.db.Where("user_id = ?", userID)

	// Filter berdasarkan month dan year
	if month != "" && year != "" {
		log.Printf("[GET MY ATTENDANCE] Filtering by month: %s, year: %s", month, year)
		query = query.Where("EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ?", month, year)
	} else if month != "" {
		log.Printf("[GET MY ATTENDANCE] Filtering by month only: %s", month)
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	}

	var total int64
	query.Model(&models.Attendance{}).Count(&total)
	log.Printf("[GET MY ATTENDANCE] Total records found: %d", total)

	var attendances []models.Attendance
	if err := query.Order("check_in_time DESC").Offset(offset).Limit(limit).Find(&attendances).Error; err != nil {
		log.Printf("[GET MY ATTENDANCE] Database error: %v", err)
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attendance records", err)
	}

	log.Printf("[GET MY ATTENDANCE] Retrieved %d records", len(attendances))
	for i, att := range attendances {
		// Gunakan CheckInTime.Format untuk mendapatkan tanggal
		date := att.CheckInTime.Format("2006-01-02")
		log.Printf("[GET MY ATTENDANCE] Record %d - ID: %s, Date: %s, CheckIn: %v, CheckOut: %v", 
			i+1, att.ID, date, att.CheckInTime, att.CheckOutTime)
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	log.Printf("[GET MY ATTENDANCE] Response meta: %+v", meta)
	return utils.PaginatedSuccessResponse(c, "Attendance records retrieved successfully", attendances, meta)
}

func (h *AttendanceHandler) GetAllAttendance(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	month := c.Query("month", "")
	userIDStr := c.Query("user_id", "")

	offset := (page - 1) * limit

	query := h.db.Preload("User").Preload("User.Role")

	// Exclude admin users from attendance records
	query = query.Joins("JOIN users ON attendances.user_id = users.id").Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name != 'admin'")

	if month != "" {
		// Ganti DATE_FORMAT (MySQL) dengan TO_CHAR (PostgreSQL)
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	}

	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format", err)
		}
		query = query.Where("user_id = ?", userID)
	}

	var total int64
	query.Model(&models.Attendance{}).Count(&total)

	var attendances []models.Attendance
	if err := query.Order("check_in_time DESC").Offset(offset).Limit(limit).Find(&attendances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attendance records", err)
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	return utils.PaginatedSuccessResponse(c, "Attendance records retrieved successfully", attendances, meta)
}

// GetAttendanceStats returns attendance statistics
func (h *AttendanceHandler) GetAttendanceStats(c *fiber.Ctx) error {
	userIDStr := c.Query("user_id", "")
	month := c.Query("month", time.Now().Format("2006-01"))

	query := h.db.Model(&models.Attendance{})

	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format", err)
		}
		query = query.Where("user_id = ?", userID)
	}

	if month != "" {
		// Ganti DATE_FORMAT (MySQL) dengan TO_CHAR (PostgreSQL)
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	}

	var totalDays int64
	query.Count(&totalDays)

	var presentDays int64
	query.Where("check_out_time IS NOT NULL").Count(&presentDays)

	var lateDays int64
	query.Where("TIME(check_in_time) > '09:00:00'").Count(&lateDays)

	stats := map[string]interface{}{
		"total_days":   totalDays,
		"present_days": presentDays,
		"absent_days":  totalDays - presentDays,
		"late_days":    lateDays,
		"month":        month,
	}

	return utils.SuccessResponse(c, "Attendance statistics retrieved successfully", stats)
}

// GetTodayAttendance returns today's attendance status for a user
func (h *AttendanceHandler) GetTodayAttendance(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)
	today := time.Now().Format("2006-01-02")

	var attendance models.Attendance
	err := h.db.Where("user_id = ? AND DATE(check_in_time) = ?", userID, today).First(&attendance).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SuccessResponse(c, "No attendance record for today", map[string]interface{}{
				"checked_in": false,
				"date":       today,
			})
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch today's attendance", err)
	}

	response := map[string]interface{}{
		"checked_in":     true,
		"checked_out":    attendance.CheckOutTime != nil,
		"check_in_time":  attendance.CheckInTime,
		"check_out_time": attendance.CheckOutTime,
		"date":           today,
		"attendance":     attendance,
	}

	return utils.SuccessResponse(c, "Today's attendance retrieved successfully", response)
}

// DeleteAttendance allows admin to delete attendance record
func (h *AttendanceHandler) DeleteAttendance(c *fiber.Ctx) error {
	attendanceID := c.Params("id")
	id, err := uuid.Parse(attendanceID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid attendance ID format", err)
	}

	var attendance models.Attendance
	if err := h.db.First(&attendance, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Attendance record not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to find attendance record", err)
	}

	if err := h.db.Delete(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete attendance record", err)
	}

	return utils.SuccessResponse(c, "Attendance record deleted successfully", nil)
}

// UpdateAttendance allows admin to update attendance record
func (h *AttendanceHandler) UpdateAttendance(c *fiber.Ctx) error {
	attendanceID := c.Params("id")
	id, err := uuid.Parse(attendanceID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid attendance ID format", err)
	}

	var attendance models.Attendance
	if err := h.db.First(&attendance, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Attendance record not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to find attendance record", err)
	}

	type UpdateRequest struct {
		Notes       *string    `json:"notes"`
		CheckOutTime *time.Time `json:"check_out_time"`
	}

	var req UpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	if req.Notes != nil {
		attendance.Notes = *req.Notes
	}

	if req.CheckOutTime != nil {
		attendance.CheckOutTime = req.CheckOutTime
	}

	if err := h.db.Save(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update attendance record", err)
	}

	// Load user for response
	h.db.Preload("User").First(&attendance, attendance.ID)

	return utils.SuccessResponse(c, "Attendance record updated successfully", attendance)
}

// GetMealAllowanceManagement returns meal allowance management data for admin
func (h *AttendanceHandler) GetMealAllowanceManagement(c *fiber.Ctx) error {
	month := c.QueryInt("month", int(time.Now().Month()))
	year := c.QueryInt("year", time.Now().Year())

	// Validate month and year
	if month < 1 || month > 12 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid month", nil)
	}
	if year < 2020 || year > 2030 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year", nil)
	}

	// Get all users with employee role
	var users []models.User
	if err := h.db.Joins("JOIN roles ON users.role_id = roles.id").
		Where("roles.name = ?", "employee").
		Find(&users).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch employees", err)
	}

	type EmployeeData struct {
		UserID              string  `json:"user_id"`
		Name                string  `json:"name"`
		TotalAttendance     int     `json:"total_attendance"`
		ValidAttendance     int     `json:"valid_attendance"`
		TotalMealAllowance  float64 `json:"total_meal_allowance"`
		ClaimStatus         *string `json:"claim_status"`
		ClaimDate          *time.Time `json:"claim_date"`
	}

	var employees []EmployeeData
	totalAllowance := 0.0
	claimedCount := 0
	unclaimedCount := 0

	for _, user := range users {
		// Count total attendance for the month
		var totalAttendance int64
		h.db.Model(&models.Attendance{}).
			Where("user_id = ? AND EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ?",
				user.ID, month, year).
			Count(&totalAttendance)

		// Count valid attendance (is_valid = true)
		var validAttendance int64
		h.db.Model(&models.Attendance{}).
			Where("user_id = ? AND EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ? AND is_valid = ?",
				user.ID, month, year, true).
			Count(&validAttendance)

		// Calculate meal allowance (15000 per valid attendance)
		mealAllowance := float64(validAttendance) * 15000

		// Check if user has claimed meal allowance for this month
		var claim models.MealAllowanceClaim
		claimErr := h.db.Where("user_id = ? AND EXTRACT(MONTH FROM claim_date) = ? AND EXTRACT(YEAR FROM claim_date) = ?",
			user.ID, month, year).First(&claim).Error

		var claimStatus *string
		var claimDate *time.Time
		if claimErr == nil {
			claimStatus = &claim.Status
			claimDate = &claim.ClaimDate
			claimedCount++
		} else {
			unclaimedCount++
		}

		employees = append(employees, EmployeeData{
			UserID:             user.ID.String(),
			Name:               user.Name,
			TotalAttendance:    int(totalAttendance),
			ValidAttendance:    int(validAttendance),
			TotalMealAllowance: mealAllowance,
			ClaimStatus:        claimStatus,
			ClaimDate:         claimDate,
		})

		totalAllowance += mealAllowance
	}

	response := map[string]interface{}{
		"summary": map[string]interface{}{
			"total_employees":  len(users),
			"total_allowance":  totalAllowance,
			"claimed_count":    claimedCount,
			"unclaimed_count":  unclaimedCount,
		},
		"employees": employees,
	}

	return utils.SuccessResponse(c, "Meal allowance management data retrieved successfully", response)
}

// GetEmployeeAttendanceDetail retrieves detailed attendance records for a specific employee
func (h *AttendanceHandler) GetEmployeeAttendanceDetail(c *fiber.Ctx) error {
	userID := c.Params("userId")
	if userID == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "User ID is required", nil)
	}

	// Parse month and year from query parameters
	monthStr := c.Query("month")
	yearStr := c.Query("year")

	if monthStr == "" || yearStr == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Month and year are required", nil)
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid month", nil)
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year", nil)
	}

	// Get attendance records for the specific user, month, and year
	var attendances []models.Attendance
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, -1).Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	err = h.db.Where("user_id = ? AND check_in_time BETWEEN ? AND ?", userID, startDate, endDate).Find(&attendances).Error
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to retrieve attendance records", err)
	}

	return utils.SuccessResponse(c, "Employee attendance details retrieved successfully", attendances)
}

