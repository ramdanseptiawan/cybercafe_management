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
	return &MealAllowanceHandler{
		db:  db,
		cfg: cfg,
	}
}

// GetMealAllowancePreview returns meal allowance preview for current user
func (h *MealAllowanceHandler) GetMealAllowancePreview(c *fiber.Ctx) error {
	userIDInterface := c.Locals("user_id")
	if userIDInterface == nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated", nil)
	}
	userID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID", nil)
	}

	// userID is already a UUID from context
	userUUID := userID

	// Get month and year from query params or use current
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	// Parse month and year from query parameters if provided
	if monthStr := c.Query("month"); monthStr != "" {
		if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
			month = m
		}
	}
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil && y >= 2020 && y <= 2030 {
			year = y
		}
	}

	// Get meal allowance policy
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		// Create default policy if not exists
		policy = models.MealAllowancePolicy{
			AmountPerDay:      15000,
			MinWorkingHours:   8,
			MaxClaimsPerMonth: 1,
			IsActive:          true,
		}
		h.db.Create(&policy)
	}

	// Get attendance data for the month
	totalAttendance, validAttendance := models.GetValidAttendanceCount(h.db, userUUID, month, year)

	// Check if user can claim
	canClaim := models.CanUserClaim(h.db, userUUID, month, year)

	// Check if already claimed
	var existingClaim models.MealAllowanceClaim
	alreadyClaimed := false
	claimStatus := ""
	if err := h.db.Where("user_id = ? AND month = ? AND year = ?", userUUID, month, year).First(&existingClaim).Error; err == nil {
		alreadyClaimed = true
		claimStatus = existingClaim.Status
	}

	// Calculate total amount
	totalAmount := float64(validAttendance) * policy.AmountPerDay

	preview := models.MealAllowancePreview{
		Month:           month,
		Year:            year,
		TotalAttendance: totalAttendance,
		ValidAttendance: validAttendance,
		AmountPerDay:    policy.AmountPerDay,
		TotalAmount:     totalAmount,
		CanClaim:        canClaim && validAttendance > 0,
		AlreadyClaimed:  alreadyClaimed,
		ClaimStatus:     claimStatus,
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    preview,
	})
}

// ClaimMealAllowance creates a new meal allowance claim
func (h *MealAllowanceHandler) ClaimMealAllowance(c *fiber.Ctx) error {
	userIDInterface := c.Locals("user_id")
	if userIDInterface == nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated", nil)
	}
	userUUID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID", nil)
	}

	// Parse request body
	var req struct {
		Month int    `json:"month"`
		Year  int    `json:"year"`
		Notes string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Validate month and year
	if req.Month < 1 || req.Month > 12 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid month", nil)
	}
	if req.Year < 2020 || req.Year > 2030 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year", nil)
	}

	// Check if user can claim
	if !models.CanUserClaim(h.db, userUUID, req.Month, req.Year) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "You have already claimed meal allowance for this month", nil)
	}

	// Get meal allowance policy
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Meal allowance policy not found", err)
	}

	// Get attendance data
	totalAttendance, validAttendance := models.GetValidAttendanceCount(h.db, userUUID, req.Month, req.Year)

	// Validate attendance
	if validAttendance == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No valid attendance found for this month", nil)
	}

	// Create meal allowance claim
	claim := models.MealAllowanceClaim{
		UserID:          userUUID,
		Month:           req.Month,
		Year:            req.Year,
		TotalAttendance: totalAttendance,
		ValidAttendance: validAttendance,
		AmountPerDay:    policy.AmountPerDay,
		Status:          "pending",
		ClaimDate:       time.Now(),
		Notes:           req.Notes,
	}
	claim.CalculateTotalAmount()

	if err := h.db.Create(&claim).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create meal allowance claim", err)
	}

	// Load user data
	if err := h.db.Preload("User").First(&claim, claim.ID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load claim data", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Meal allowance claim submitted successfully",
		"data":    claim,
	})
}

// GetMyMealAllowances returns current user's meal allowance claims
func (h *MealAllowanceHandler) GetMyMealAllowances(c *fiber.Ctx) error {
	userIDInterface := c.Locals("user_id")
	if userIDInterface == nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated", nil)
	}
	userUUID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID", nil)
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	// Get filter parameters
	status := c.Query("status")
	yearStr := c.Query("year")

	// Build query
	query := h.db.Model(&models.MealAllowanceClaim{}).Where("user_id = ?", userUUID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			query = query.Where("year = ?", year)
		}
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get claims with pagination
	var claims []models.MealAllowanceClaim
	if err := query.Preload("User").Preload("Approver").Order("created_at DESC").Limit(limit).Offset(offset).Find(&claims).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch meal allowance claims", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"claims": claims,
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": total,
				"pages": (total + int64(limit) - 1) / int64(limit),
			},
		},
	})
}

// GetAllMealAllowances returns all meal allowance claims (admin only)
func (h *MealAllowanceHandler) GetAllMealAllowances(c *fiber.Ctx) error {
	// Get pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	// Get filter parameters
	status := c.Query("status")
	yearStr := c.Query("year")
	monthStr := c.Query("month")
	userIDStr := c.Query("user_id")

	// Build query
	query := h.db.Model(&models.MealAllowanceClaim{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			query = query.Where("year = ?", year)
		}
	}
	if monthStr != "" {
		if month, err := strconv.Atoi(monthStr); err == nil {
			query = query.Where("month = ?", month)
		}
	}
	if userIDStr != "" {
		if userUUID, err := uuid.Parse(userIDStr); err == nil {
			query = query.Where("user_id = ?", userUUID)
		}
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get claims with pagination
	var claims []models.MealAllowanceClaim
	if err := query.Preload("User").Preload("Approver").Order("created_at DESC").Limit(limit).Offset(offset).Find(&claims).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch meal allowance claims", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"claims": claims,
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": total,
				"pages": (total + int64(limit) - 1) / int64(limit),
			},
		},
	})
}

// ApproveMealAllowance approves a meal allowance claim (admin only)
func (h *MealAllowanceHandler) ApproveMealAllowance(c *fiber.Ctx) error {
	claimID := c.Params("id")
	claimUUID, err := uuid.Parse(claimID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid claim ID", err)
	}

	// Get approver ID
	approverIDInterface := c.Locals("user_id")
	if approverIDInterface == nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated", nil)
	}
	approverUUID, ok := approverIDInterface.(uuid.UUID)
	if !ok {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID", nil)
	}

	// Find the claim
	var claim models.MealAllowanceClaim
	if err := h.db.First(&claim, claimUUID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Meal allowance claim not found", err)
	}

	// Check if already processed
	if claim.Status != "pending" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Claim has already been processed", nil)
	}

	// Update claim status
	now := time.Now()
	claim.Status = "approved"
	claim.ApprovedBy = &approverUUID
	claim.ApprovedAt = &now

	if err := h.db.Save(&claim).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to approve meal allowance claim", err)
	}

	// Load related data
	if err := h.db.Preload("User").Preload("Approver").First(&claim, claim.ID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load claim data", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Meal allowance claim approved successfully",
		"data":    claim,
	})
}

// RejectMealAllowance rejects a meal allowance claim (admin only)
func (h *MealAllowanceHandler) RejectMealAllowance(c *fiber.Ctx) error {
	claimID := c.Params("id")
	claimUUID, err := uuid.Parse(claimID)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid claim ID", err)
	}

	// Parse request body
	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Find the claim
	var claim models.MealAllowanceClaim
	if err := h.db.First(&claim, claimUUID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Meal allowance claim not found", err)
	}

	// Check if already processed
	if claim.Status != "pending" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Claim has already been processed", nil)
	}

	// Update claim status
	claim.Status = "rejected"
	claim.RejectionReason = req.Reason

	if err := h.db.Save(&claim).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to reject meal allowance claim", err)
	}

	// Load related data
	if err := h.db.Preload("User").First(&claim, claim.ID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to load claim data", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Meal allowance claim rejected successfully",
		"data":    claim,
	})
}

// GetMealAllowancePolicy returns the current meal allowance policy
func (h *MealAllowanceHandler) GetMealAllowancePolicy(c *fiber.Ctx) error {
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		// Create default policy if not exists
		policy = models.MealAllowancePolicy{
			AmountPerDay:      15000,
			MinWorkingHours:   8,
			MaxClaimsPerMonth: 1,
			IsActive:          true,
		}
		h.db.Create(&policy)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    policy,
	})
}

// UpdateMealAllowancePolicy updates the meal allowance policy (admin only)
func (h *MealAllowanceHandler) UpdateMealAllowancePolicy(c *fiber.Ctx) error {
	var req models.MealAllowancePolicy
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Validate input
	if req.AmountPerDay <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Amount per day must be greater than 0", nil)
	}
	if req.MinWorkingHours <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Minimum working hours must be greater than 0", nil)
	}
	if req.MaxClaimsPerMonth <= 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Maximum claims per month must be greater than 0", nil)
	}

	// Get current policy
	var policy models.MealAllowancePolicy
	if err := h.db.Where("is_active = true").First(&policy).Error; err != nil {
		// Create new policy if not exists
		policy = models.MealAllowancePolicy{
			AmountPerDay:      req.AmountPerDay,
			MinWorkingHours:   req.MinWorkingHours,
			MaxClaimsPerMonth: req.MaxClaimsPerMonth,
			IsActive:          true,
		}
		if err := h.db.Create(&policy).Error; err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create meal allowance policy", err)
		}
	} else {
		// Update existing policy
		policy.AmountPerDay = req.AmountPerDay
		policy.MinWorkingHours = req.MinWorkingHours
		policy.MaxClaimsPerMonth = req.MaxClaimsPerMonth
		if err := h.db.Save(&policy).Error; err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update meal allowance policy", err)
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Meal allowance policy updated successfully",
		"data":    policy,
	})
}

// GetMealAllowanceStats returns statistics for meal allowances
func (h *MealAllowanceHandler) GetMealAllowanceStats(c *fiber.Ctx) error {
	// Parse month and year from query parameters
	now := time.Now()
	month := int(now.Month())
	year := now.Year()

	if monthStr := c.Query("month"); monthStr != "" {
		if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
			month = m
		}
	}
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil && y >= 2020 {
			year = y
		}
	}

	// Get statistics
	var totalClaims int64
	var approvedClaims int64
	var pendingClaims int64
	var rejectedClaims int64
	var totalAmount float64

	// Count total claims for the month/year
	h.db.Model(&models.MealAllowanceClaim{}).Where("month = ? AND year = ?", month, year).Count(&totalClaims)

	// Count approved claims
	h.db.Model(&models.MealAllowanceClaim{}).Where("month = ? AND year = ? AND status = ?", month, year, "approved").Count(&approvedClaims)

	// Count pending claims
	h.db.Model(&models.MealAllowanceClaim{}).Where("month = ? AND year = ? AND status = ?", month, year, "pending").Count(&pendingClaims)

	// Count rejected claims
	h.db.Model(&models.MealAllowanceClaim{}).Where("month = ? AND year = ? AND status = ?", month, year, "rejected").Count(&rejectedClaims)

	// Calculate total amount for approved claims
	h.db.Model(&models.MealAllowanceClaim{}).Where("month = ? AND year = ? AND status = ?", month, year, "approved").Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount)

	stats := fiber.Map{
		"month":          month,
		"year":           year,
		"total_claims":   totalClaims,
		"approved_claims": approvedClaims,
		"pending_claims":  pendingClaims,
		"rejected_claims": rejectedClaims,
		"total_amount":   totalAmount,
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Meal allowance statistics retrieved successfully",
		"data":    stats,
	})
}