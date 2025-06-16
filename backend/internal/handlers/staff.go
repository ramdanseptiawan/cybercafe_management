package handlers

import (
	"strconv"

	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StaffHandler struct {
	db *gorm.DB
}

func NewStaffHandler(db *gorm.DB) *StaffHandler {
	return &StaffHandler{db: db}
}

type CreateStaffRequest struct {
	Username   string    `json:"username" validate:"required"`
	Email      string    `json:"email" validate:"required,email"`
	Password   string    `json:"password" validate:"required,min=6"`
	Name       string    `json:"name" validate:"required"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	KTPNumber  string    `json:"ktp_number"`
	EmployeeID string    `json:"employee_id"`
	RoleID     uuid.UUID `json:"role_id" validate:"required"`
}

func (h *StaffHandler) CreateStaff(c *fiber.Ctx) error {
	var req CreateStaffRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Check if username, email, KTP number, or employee ID already exists
	var existingUser models.User
	query := "username = ? OR email = ?"
	args := []interface{}{req.Username, req.Email}
	
	if req.KTPNumber != "" {
		query += " OR ktp_number = ?"
		args = append(args, req.KTPNumber)
	}
	
	if req.EmployeeID != "" {
		query += " OR employee_id = ?"
		args = append(args, req.EmployeeID)
	}
	
	if err := h.db.Where(query, args...).First(&existingUser).Error; err == nil {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Username, email, KTP number, or employee ID already exists", nil)
	}

	// Check if role exists
	var role models.Role
	if err := h.db.Where("id = ?", req.RoleID).First(&role).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid role ID", err)
	}

	user := models.User{
		Username:   req.Username,
		Email:      req.Email,
		Name:       req.Name,
		Phone:      req.Phone,
		Address:    req.Address,
		KTPNumber:  req.KTPNumber,
		EmployeeID: req.EmployeeID,
		RoleID:     req.RoleID,
		IsActive:   true,
	}

	if err := user.SetPassword(req.Password); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to hash password", err)
	}

	if err := h.db.Create(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create staff", err)
	}

	// Load role for response
	h.db.Preload("Role").First(&user, user.ID)

	return utils.SuccessResponse(c, "Staff created successfully", user.ToResponse())
}

func (h *StaffHandler) GetAllStaff(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")

	offset := (page - 1) * limit

	query := h.db.Preload("Role")
	
	// Exclude admin users from staff list
	query = query.Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name != 'admin'")
	
	if search != "" {
		query = query.Where("name LIKE ? OR username LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.User{}).Count(&total)

	var users []models.User
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch staff", err)
	}

	var responses []models.UserResponse
	for _, user := range users {
		responses = append(responses, user.ToResponse())
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	return utils.PaginatedSuccessResponse(c, "Staff retrieved successfully", responses, meta)
}

func (h *StaffHandler) GetStaffByID(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID", err)
	}

	var user models.User
	if err := h.db.Preload("Role").Where("id = ?", userID).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Staff not found", err)
	}

	return utils.SuccessResponse(c, "Staff retrieved successfully", user.ToResponse())
}

type UpdateStaffRequest struct {
	Email      string    `json:"email" validate:"email"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	KTPNumber  string    `json:"ktp_number"`
	EmployeeID string    `json:"employee_id"`
	RoleID     uuid.UUID `json:"role_id"`
}

func (h *StaffHandler) UpdateStaff(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID", err)
	}

	var req UpdateStaffRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Staff not found", err)
	}

	// Check if role exists if provided
	if req.RoleID != uuid.Nil {
		var role models.Role
		if err := h.db.Where("id = ?", req.RoleID).First(&role).Error; err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid role ID", err)
		}
		user.RoleID = req.RoleID
	}

	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.KTPNumber != "" {
		user.KTPNumber = req.KTPNumber
	}
	if req.EmployeeID != "" {
		user.EmployeeID = req.EmployeeID
	}

	if err := h.db.Save(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update staff", err)
	}

	// Load role for response
	h.db.Preload("Role").First(&user, user.ID)

	return utils.SuccessResponse(c, "Staff updated successfully", user.ToResponse())
}

func (h *StaffHandler) DeleteStaff(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID", err)
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Staff not found", err)
	}

	// Soft delete by setting is_active to false
	user.IsActive = false
	if err := h.db.Save(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete staff", err)
	}

	return utils.SuccessResponse(c, "Staff deleted successfully", nil)
}