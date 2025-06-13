package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MealAllowanceStatus string

const (
	MealAllowanceStatusPending   MealAllowanceStatus = "pending"
	MealAllowanceStatusApproved  MealAllowanceStatus = "approved"
	MealAllowanceStatusRejected  MealAllowanceStatus = "rejected"
	MealAllowanceStatusPaid      MealAllowanceStatus = "paid"
)

type MealAllowance struct {
	ID           uuid.UUID           `json:"id" gorm:"type:char(36);primaryKey"`
	UserID       uuid.UUID           `json:"user_id" gorm:"type:char(36);not null"`
	User         User                `json:"user" gorm:"foreignKey:UserID"`
	AttendanceID uuid.UUID           `json:"attendance_id" gorm:"type:char(36);not null"`
	Attendance   Attendance          `json:"attendance" gorm:"foreignKey:AttendanceID"`
	Amount       float64             `json:"amount" gorm:"default:25000"`
	Status       MealAllowanceStatus `json:"status" gorm:"default:'pending'"`
	ClaimDate    time.Time           `json:"claim_date" gorm:"not null"`
	ApprovedBy   *uuid.UUID          `json:"approved_by" gorm:"type:char(36)"`
	Approver     *User               `json:"approver" gorm:"foreignKey:ApprovedBy"`
	ApprovedAt   *time.Time          `json:"approved_at"`
	PaidAt       *time.Time          `json:"paid_at"`
	Notes        string              `json:"notes"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
}

func (m *MealAllowance) BeforeCreate(tx *gorm.DB) error {
	m.ID = uuid.New()
	return nil
}

// Check if attendance is eligible for meal allowance
func (m *MealAllowance) IsEligible() bool {
	// Check if attendance is valid and has both check-in and check-out
	return m.Attendance.IsValid && m.Attendance.CheckOutTime != nil
}

// Get working hours for the attendance
func (m *MealAllowance) GetWorkingHours() float64 {
	return m.Attendance.GetWorkingHours()
}