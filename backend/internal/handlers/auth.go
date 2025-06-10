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

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string                `json:"token"`
	User  models.UserResponse   `json:"user"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	var user models.User
	if err := h.db.Preload("Role").Where("username = ? AND is_active = ?", req.Username, true).First(&user).Error; err != nil {
		// Log failed login attempt
		go func() {
			auditLog := models.AuditLog{
				Action:    "LOGIN_FAILED",
				Resource:  "/auth/login",
				Details:   "Failed login attempt for username: " + req.Username,
				IPAddress: c.IP(),
				UserAgent: c.Get("User-Agent"),
			}
			h.db.Create(&auditLog)
		}()
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid credentials", nil)
	}

	if !user.CheckPassword(req.Password) {
		// Log failed login attempt
		go func() {
			auditLog := models.AuditLog{
				Action:    "LOGIN_FAILED",
				Resource:  "/auth/login",
				Details:   "Invalid password for username: " + req.Username,
				IPAddress: c.IP(),
				UserAgent: c.Get("User-Agent"),
			}
			h.db.Create(&auditLog)
		}()
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid credentials", nil)
	}

	// Generate JWT token
	expireDuration, _ := time.ParseDuration(h.cfg.JWTExpire)
	token, err := utils.GenerateToken(user.ID, user.Username, user.Role.Name, h.cfg.JWTSecret, expireDuration)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to generate token", err)
	}

	// Capture values before goroutine to avoid context reuse issues
	ipAddress := c.IP()
	userAgent := c.Get("User-Agent")

	// Log successful login
	go func() {
		auditLog := models.AuditLog{
			UserID:    user.ID,
			Action:    "LOGIN_SUCCESS",
			Resource:  "/auth/login",
			Details:   "User logged in successfully",
			IPAddress: ipAddress,
			UserAgent: userAgent,
		}
		h.db.Create(&auditLog)
	}()

	response := LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	return utils.SuccessResponse(c, "Login successful", response)
}

func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id")

	var user models.User
	if err := h.db.Preload("Role").Where("id = ?", userID).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found", err)
	}

	return utils.SuccessResponse(c, "Profile retrieved successfully", user.ToResponse())
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("user_id")

	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "User not found", err)
	}

	if !user.CheckPassword(req.CurrentPassword) {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Current password is incorrect", nil)
	}

	if err := user.SetPassword(req.NewPassword); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to hash password", err)
	}

	if err := h.db.Save(&user).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update password", err)
	}

	return utils.SuccessResponse(c, "Password changed successfully", nil)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	if userID == nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "User not authenticated", nil)
	}

	// Capture values before goroutine to avoid context reuse issues
	ipAddress := c.IP()
	userAgent := c.Get("User-Agent")

	// Log logout
	go func() {
		// Convert userID to uuid.UUID
		var userUUID uuid.UUID
		switch v := userID.(type) {
		case uuid.UUID:
			userUUID = v
		case string:
			parsed, parseErr := uuid.Parse(v)
			if parseErr != nil {
				return
			}
			userUUID = parsed
		default:
			return
		}

		auditLog := models.AuditLog{
			UserID:    userUUID,
			Action:    "LOGOUT",
			Resource:  "/auth/logout",
			Details:   "User logged out",
			IPAddress: ipAddress,  // Use captured value
			UserAgent: userAgent,  // Use captured value
		}
		h.db.Create(&auditLog)
	}()

	return utils.SuccessResponse(c, "Logout successful", nil)
}