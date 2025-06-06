package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID        uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:char(36)"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	Action    string    `json:"action" gorm:"not null"`
	Resource  string    `json:"resource" gorm:"not null"`
	Details   string    `json:"details" gorm:"type:text"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	a.ID = uuid.New()
	return nil
}