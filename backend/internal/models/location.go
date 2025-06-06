package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Location struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Address      string    `json:"address"`
	Latitude     float64   `json:"latitude" gorm:"type:decimal(10,8);not null"`
	Longitude    float64   `json:"longitude" gorm:"type:decimal(11,8);not null"`
	Radius       int       `json:"radius" gorm:"default:100"` // radius in meters
	Type         string    `json:"type" gorm:"type:varchar(20);default:'office'"` // office, branch, client_site, remote
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	WorkingHours string    `json:"working_hours" gorm:"type:jsonb"` // JSON string
	Timezone     string    `json:"timezone" gorm:"default:'Asia/Jakarta'"`
	CreatedBy    string    `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (l *Location) BeforeCreate(tx *gorm.DB) error {
	l.ID = uuid.New()
	return nil
}

type LocationResponse struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Address      string    `json:"address"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Radius       int       `json:"radius"`
	Type         string    `json:"type"`
	IsActive     bool      `json:"is_active"`
	WorkingHours string    `json:"working_hours"`
	Timezone     string    `json:"timezone"`
	CreatedBy    string    `json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (l *Location) ToResponse() LocationResponse {
	return LocationResponse{
		ID:           l.ID,
		Name:         l.Name,
		Address:      l.Address,
		Latitude:     l.Latitude,
		Longitude:    l.Longitude,
		Radius:       l.Radius,
		Type:         l.Type,
		IsActive:     l.IsActive,
		WorkingHours: l.WorkingHours,
		Timezone:     l.Timezone,
		CreatedBy:    l.CreatedBy,
		CreatedAt:    l.CreatedAt,
		UpdatedAt:    l.UpdatedAt,
	}
}