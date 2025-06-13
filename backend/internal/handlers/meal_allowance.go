package handlers

import (
	"strconv"
	"time"

	"cybercafe-backend/internal/config"
	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MealAllowanceHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewMealAllowanceHandler(db *gorm.DB, cfg *config.Config) *MealAllowanceHandler {
	return &MealAllowanceHandler{db: db, cfg: cfg}
}

type ClaimMealAllowanceRequest struct {
	AttendanceID uuid.UUID `json:"attendance_id" validate:"required"`
	Notes        string    `json:"notes"`
}

type UpdateMealAllowanceRequest struct {
	Status models.MealAllowanceStatus `json:"status" validate:"required"`
	Notes  string                     `json:"notes"`
}

// ClaimMealAllowance - Employee claims meal allowance for valid attendance
func (h *MealAllowanceHandler) ClaimMealAllowance(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	var req ClaimMealAllowanceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Check if attendance exists and belongs to the user
	var attendance models.Attendance
	if err := h.db.Where("id = ? AND user_id = ?", req.AttendanceID, userID).First(&attendance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Attendance record not found", err)
	}

	// Check if attendance is valid and has check-out time
	if !attendance.IsValid || attendance.CheckOutTime == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Attendance is not eligible for meal allowance", nil)
	}

	// Check if meal allowance already claimed for this attendance
	var existingClaim models.MealAllowance
	if err := h.db.Where("attendance_id = ?", req.AttendanceID).First(&existingClaim).Error; err == nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Meal allowance already claimed for this attendance", nil)
	}

	// Check if user has already claimed meal allowance for this month
	currentTime := time.Now()
	startOfMonth := time.Date(currentTime.Year(), currentTime.Month(), 1, 0, 0, 0, 0, currentTime.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	var monthlyClaimCount int64
	h.db.Model(&models.MealAllowance{}).Where("user_id = ? AND claim_date >= ? AND claim_date <= ?", userID, startOfMonth, endOfMonth).Count(&monthlyClaimCount)
	if monthlyClaimCount > 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Meal allowance already claimed for this month", nil)
	}

	// Calculate meal allowance amount based on valid attendances in current month
	var validAttendanceCount int64
	h.db.Model(&models.Attendance{}).Where("user_id = ? AND is_valid = ? AND check_out_time IS NOT NULL AND check_in_time >= ? AND check_in_time <= ?", userID, true, startOfMonth, endOfMonth).Count(&validAttendanceCount)

	// Calculate amount: 25,000 per valid attendance day
	amount := float64(validAttendanceCount) * 25000

	// Create meal allowance claim
	mealAllowance := models.MealAllowance{
		UserID:       userID,
		AttendanceID: req.AttendanceID,
		Amount:       amount,
		Status:       models.MealAllowanceStatusPending,
		ClaimDate:    time.Now(),
		Notes:        req.Notes,
	}

	if err := h.db.Create(&mealAllowance).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create meal allowance claim", err)
	}

	// Load relations for response
	h.db.Preload("User").Preload("Attendance").First(&mealAllowance, mealAllowance.ID)

	return utils.SuccessResponse(c, "Meal allowance claimed successfully", mealAllowance)
}

// GetMyMealAllowances - Get current user's meal allowance claims
func (h *MealAllowanceHandler) GetMyMealAllowances(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")
	month := c.Query("month")
	year := c.Query("year")

	offset := (page - 1) * limit

	// Build query
	query := h.db.Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if month != "" && year != "" {
		query = query.Where("EXTRACT(MONTH FROM claim_date) = ? AND EXTRACT(YEAR FROM claim_date) = ?", month, year)
	} else if year != "" {
		query = query.Where("EXTRACT(YEAR FROM claim_date) = ?", year)
	}

	// Get total count
	var total int64
	query.Model(&models.MealAllowance{}).Count(&total)

	// Get records with pagination
	var mealAllowances []models.MealAllowance
	if err := query.Preload("User").Preload("Attendance").Preload("Approver").
		Order("claim_date DESC").Offset(offset).Limit(limit).Find(&mealAllowances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch meal allowances", err)
	}

	// Calculate total pages
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	return utils.PaginatedSuccessResponse(c, "Meal allowances retrieved successfully", mealAllowances, meta)
}

// GetAllMealAllowances - Admin gets all meal allowance claims
func (h *MealAllowanceHandler) GetAllMealAllowances(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")
	userID := c.Query("user_id")
	month := c.Query("month")
	year := c.Query("year")

	offset := (page - 1) * limit

	// Build query
	query := h.db.Model(&models.MealAllowance{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if month != "" && year != "" {
		query = query.Where("EXTRACT(MONTH FROM claim_date) = ? AND EXTRACT(YEAR FROM claim_date) = ?", month, year)
	} else if year != "" {
		query = query.Where("EXTRACT(YEAR FROM claim_date) = ?", year)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get records with pagination
	var mealAllowances []models.MealAllowance
	if err := query.Preload("User").Preload("Attendance").Preload("Approver").
		Order("claim_date DESC").Offset(offset).Limit(limit).Find(&mealAllowances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch meal allowances", err)
	}

	// Calculate total pages
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	return utils.PaginatedSuccessResponse(c, "Meal allowances retrieved successfully", mealAllowances, meta)
}

// UpdateMealAllowanceStatus - Admin approves/rejects meal allowance
func (h *MealAllowanceHandler) UpdateMealAllowanceStatus(c *fiber.Ctx) error {
	adminID := c.Locals("user_id").(uuid.UUID)
	mealAllowanceID := c.Params("id")

	var req UpdateMealAllowanceRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Find meal allowance
	var mealAllowance models.MealAllowance
	if err := h.db.First(&mealAllowance, "id = ?", mealAllowanceID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Meal allowance not found", err)
	}

	// Update status
	updateData := map[string]interface{}{
		"status": req.Status,
		"notes":  req.Notes,
	}

	if req.Status == models.MealAllowanceStatusApproved || req.Status == models.MealAllowanceStatusRejected {
		updateData["approved_by"] = adminID
		updateData["approved_at"] = time.Now()
	}

	if req.Status == models.MealAllowanceStatusPaid {
		updateData["paid_at"] = time.Now()
	}

	if err := h.db.Model(&mealAllowance).Updates(updateData).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update meal allowance", err)
	}

	// Load updated record with relations
	h.db.Preload("User").Preload("Attendance").Preload("Approver").First(&mealAllowance, mealAllowance.ID)

	return utils.SuccessResponse(c, "Meal allowance updated successfully", mealAllowance)
}

// GetMealAllowanceStats - Get statistics for meal allowances
func (h *MealAllowanceHandler) GetMealAllowanceStats(c *fiber.Ctx) error {
	userID := c.Query("user_id")
	month := c.Query("month")
	year := c.Query("year")

	// Build base query
	query := h.db.Model(&models.MealAllowance{})

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if month != "" && year != "" {
		query = query.Where("EXTRACT(MONTH FROM claim_date) = ? AND EXTRACT(YEAR FROM claim_date) = ?", month, year)
	} else if year != "" {
		query = query.Where("EXTRACT(YEAR FROM claim_date) = ?", year)
	}

	// Get statistics
	// Use individual variables instead of map for counting
	var totalClaims, pendingClaims, approvedClaims, rejectedClaims, paidClaims int64
	var totalAmount, paidAmount float64

	// Total claims
	query.Count(&totalClaims)

	// Claims by status
	query.Where("status = ?", models.MealAllowanceStatusPending).Count(&pendingClaims)
	query.Where("status = ?", models.MealAllowanceStatusApproved).Count(&approvedClaims)
	query.Where("status = ?", models.MealAllowanceStatusRejected).Count(&rejectedClaims)
	query.Where("status = ?", models.MealAllowanceStatusPaid).Count(&paidClaims)

	// Total amount
	query.Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount)

	// Paid amount
	query.Where("status = ?", models.MealAllowanceStatusPaid).Select("COALESCE(SUM(amount), 0)").Scan(&paidAmount)

	// Create stats map
	stats := map[string]interface{}{
		"total_claims":   totalClaims,
		"pending_claims": pendingClaims,
		"approved_claims": approvedClaims,
		"rejected_claims": rejectedClaims,
		"paid_claims":    paidClaims,
		"total_amount":   totalAmount,
		"paid_amount":    paidAmount,
	}

	return utils.SuccessResponse(c, "Meal allowance statistics retrieved successfully", stats)
}

// GetMealAllowancePreview - Get preview of meal allowance for current month
func (h *MealAllowanceHandler) GetMealAllowancePreview(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	// Get current month range
	currentTime := time.Now()
	startOfMonth := time.Date(currentTime.Year(), currentTime.Month(), 1, 0, 0, 0, 0, currentTime.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	// Count valid attendances in current month
	var validAttendanceCount int64
	h.db.Model(&models.Attendance{}).Where("user_id = ? AND is_valid = ? AND check_out_time IS NOT NULL AND check_in_time >= ? AND check_in_time <= ?", userID, true, startOfMonth, endOfMonth).Count(&validAttendanceCount)

	// Calculate potential amount
	potentialAmount := float64(validAttendanceCount) * 25000

	// Check if already claimed this month
	var existingClaim models.MealAllowance
	alreadyClaimed := h.db.Where("user_id = ? AND claim_date >= ? AND claim_date <= ?", userID, startOfMonth, endOfMonth).First(&existingClaim).Error == nil

	// Get list of valid attendances for this month
	var attendances []models.Attendance
	h.db.Where("user_id = ? AND is_valid = ? AND check_out_time IS NOT NULL AND check_in_time >= ? AND check_in_time <= ?", userID, true, startOfMonth, endOfMonth).Order("check_in_time DESC").Find(&attendances)

	preview := map[string]interface{}{
		"month":              currentTime.Format("January 2006"),
		"valid_days":         validAttendanceCount,
		"rate_per_day":       25000,
		"potential_amount":   potentialAmount,
		"already_claimed":    alreadyClaimed,
		"can_claim":          !alreadyClaimed && validAttendanceCount > 0,
		"attendances":        attendances,
	}

	if alreadyClaimed {
		preview["claimed_amount"] = existingClaim.Amount
		preview["claim_status"] = existingClaim.Status
		preview["claim_date"] = existingClaim.ClaimDate
	}

	return utils.SuccessResponse(c, "Meal allowance preview retrieved successfully", preview)
}