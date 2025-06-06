package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Attendance struct {
	ID           uuid.UUID  `json:"id" gorm:"type:char(36);primaryKey"`
	UserID       uuid.UUID  `json:"user_id" gorm:"type:char(36);not null"`
	User         User       `json:"user" gorm:"foreignKey:UserID"`
	CheckInTime  time.Time  `json:"check_in_time" gorm:"not null"`
	CheckOutTime *time.Time `json:"check_out_time"`
	PhotoPath    string     `json:"photo_path"`
	CheckOutPhotoPath *string   `json:"check_out_photo_path"` // Tambahkan field ini jika belum ada
	Latitude     float64    `json:"latitude"`
	Longitude    float64    `json:"longitude"`
	Address      string     `json:"address"`
	Distance     float64    `json:"distance"`
	IsValid      bool       `json:"is_valid" gorm:"default:true"`
	Notes        string     `json:"notes"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (a *Attendance) BeforeCreate(tx *gorm.DB) error {
	a.ID = uuid.New()
	return nil
}

func (a *Attendance) GetWorkingHours() float64 {
	if a.CheckOutTime == nil {
		return 0
	}
	duration := a.CheckOutTime.Sub(a.CheckInTime)
	return duration.Hours()
}