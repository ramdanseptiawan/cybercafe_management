package handlers

import (
	"strconv"

	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AuditHandler struct {
	db *gorm.DB
}

func NewAuditHandler(db *gorm.DB) *AuditHandler {
	return &AuditHandler{db: db}
}

func (h *AuditHandler) GetAuditLogs(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	action := c.Query("action", "")
	resource := c.Query("resource", "")

	offset := (page - 1) * limit

	query := h.db.Preload("User").Model(&models.AuditLog{})

	if action != "" {
		query = query.Where("action = ?", action)
	}
	if resource != "" {
		query = query.Where("resource LIKE ?", "%"+resource+"%")
	}

	var total int64
	query.Count(&total)

	var auditLogs []models.AuditLog
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&auditLogs).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit logs", err)
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	return utils.PaginatedSuccessResponse(c, "Audit logs retrieved successfully", auditLogs, meta)
}

func (h *AuditHandler) GetAuditLogByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var auditLog models.AuditLog
	if err := h.db.Preload("User").Where("id = ?", id).First(&auditLog).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Audit log not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch audit log", err)
	}

	return utils.SuccessResponse(c, "Audit log retrieved successfully", auditLog)
}