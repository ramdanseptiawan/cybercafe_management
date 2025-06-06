package handlers

import (
	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RoleHandler struct {
	db *gorm.DB
}

func NewRoleHandler(db *gorm.DB) *RoleHandler {
	return &RoleHandler{db: db}
}

type CreateRoleRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
	Permissions string `json:"permissions"`
}

func (h *RoleHandler) CreateRole(c *fiber.Ctx) error {
	var req CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// Check if role name already exists
	var existingRole models.Role
	if err := h.db.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Role name already exists", nil)
	}

	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
		Permissions: req.Permissions,
	}

	if err := h.db.Create(&role).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create role", err)
	}

	return utils.SuccessResponse(c, "Role created successfully", role)
}

func (h *RoleHandler) GetAllRoles(c *fiber.Ctx) error {
	var roles []models.Role
	if err := h.db.Find(&roles).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch roles", err)
	}

	return utils.SuccessResponse(c, "Roles retrieved successfully", roles)
}

func (h *RoleHandler) GetRoleByID(c *fiber.Ctx) error {
	id := c.Params("id")
	roleID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid role ID", err)
	}

	var role models.Role
	if err := h.db.Where("id = ?", roleID).First(&role).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Role not found", err)
	}

	return utils.SuccessResponse(c, "Role retrieved successfully", role)
}

type UpdateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Permissions string `json:"permissions"`
}

func (h *RoleHandler) UpdateRole(c *fiber.Ctx) error {
	id := c.Params("id")
	roleID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid role ID", err)
	}

	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	var role models.Role
	if err := h.db.Where("id = ?", roleID).First(&role).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Role not found", err)
	}

	if req.Name != "" {
		role.Name = req.Name
	}
	if req.Description != "" {
		role.Description = req.Description
	}
	if req.Permissions != "" {
		role.Permissions = req.Permissions
	}

	if err := h.db.Save(&role).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update role", err)
	}

	return utils.SuccessResponse(c, "Role updated successfully", role)
}

func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	id := c.Params("id")
	roleID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid role ID", err)
	}

	// Check if role is being used by any users
	var userCount int64
	h.db.Model(&models.User{}).Where("role_id = ?", roleID).Count(&userCount)
	if userCount > 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Cannot delete role that is assigned to users", nil)
	}

	if err := h.db.Delete(&models.Role{}, roleID).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete role", err)
	}

	return utils.SuccessResponse(c, "Role deleted successfully", nil)
}