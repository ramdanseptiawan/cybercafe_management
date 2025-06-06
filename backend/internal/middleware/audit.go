package middleware

import (
	"cybercafe-backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"strings"
)

func AuditLogger(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Continue with request
		err := c.Next()

		// Skip logging for audit endpoints to prevent infinite loops
		if strings.HasPrefix(c.Path(), "/api/audit") {
			return err
		}

		// Only log if user is authenticated
		userID := c.Locals("user_id")
		if userID == nil {
			return err
		}

		// Convert userID to uuid.UUID
		var userUUID uuid.UUID
		switch v := userID.(type) {
		case uuid.UUID:
			userUUID = v
		case string:
			parsed, parseErr := uuid.Parse(v)
			if parseErr != nil {
				return err
			}
			userUUID = parsed
		default:
			return err
		}

		auditLog := models.AuditLog{
			UserID:    userUUID,
			Action:    c.Method(),
			Resource:  c.Path(),
			IPAddress: c.IP(),
			UserAgent: c.Get("User-Agent"),
		}

		// Save audit log asynchronously
		go func() {
			db.Create(&auditLog)
		}()

		return err
	}
}