package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role struct {
	ID          uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null"`
	Description string    `json:"description"`
	Permissions string    `json:"permissions" gorm:"type:text"` // JSON string of permissions
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (r *Role) BeforeCreate(tx *gorm.DB) error {
	r.ID = uuid.New()
	return nil
}