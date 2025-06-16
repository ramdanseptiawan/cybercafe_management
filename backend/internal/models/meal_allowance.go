package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MealAllowancePolicy defines the policy for meal allowance calculation
type MealAllowancePolicy struct {
	ID                uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	AmountPerDay      float64   `json:"amount_per_day" gorm:"not null;default:15000"`
	MinWorkingHours   float64   `json:"min_working_hours" gorm:"not null;default:8"`
	MaxClaimsPerMonth int       `json:"max_claims_per_month" gorm:"not null;default:1"`
	IsActive          bool      `json:"is_active" gorm:"default:true"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (m *MealAllowancePolicy) BeforeCreate(tx *gorm.DB) error {
	m.ID = uuid.New()
	return nil
}

// MealAllowanceClaim represents a monthly meal allowance claim
type MealAllowanceClaim struct {
	ID               uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	UserID           uuid.UUID `json:"user_id" gorm:"type:char(36);not null"`
	User             User      `json:"user" gorm:"foreignKey:UserID"`
	Month            int       `json:"month" gorm:"not null"`
	Year             int       `json:"year" gorm:"not null"`
	TotalAttendance  int       `json:"total_attendance" gorm:"not null"`
	ValidAttendance  int       `json:"valid_attendance" gorm:"not null"`
	AmountPerDay     float64   `json:"amount_per_day" gorm:"not null"`
	TotalAmount      float64   `json:"total_amount" gorm:"not null"`
	Status           string    `json:"status" gorm:"default:'pending'"` // pending, approved, rejected
	ClaimDate        time.Time `json:"claim_date" gorm:"not null"`
	ApprovedBy       *uuid.UUID `json:"approved_by" gorm:"type:char(36)"`
	Approver         *User     `json:"approver,omitempty" gorm:"foreignKey:ApprovedBy"`
	ApprovedAt       *time.Time `json:"approved_at"`
	RejectionReason  string    `json:"rejection_reason"`
	Notes            string    `json:"notes"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func (m *MealAllowanceClaim) BeforeCreate(tx *gorm.DB) error {
	m.ID = uuid.New()
	return nil
}

// MealAllowancePreview represents preview data for meal allowance calculation
type MealAllowancePreview struct {
	Month           int     `json:"month"`
	Year            int     `json:"year"`
	TotalAttendance int     `json:"total_attendance"`
	ValidAttendance int     `json:"valid_attendance"`
	AmountPerDay    float64 `json:"amount_per_day"`
	TotalAmount     float64 `json:"total_amount"`
	CanClaim        bool    `json:"can_claim"`
	AlreadyClaimed  bool    `json:"already_claimed"`
	ClaimStatus     string  `json:"claim_status,omitempty"`
}

// CalculateTotalAmount calculates the total meal allowance amount
func (m *MealAllowanceClaim) CalculateTotalAmount() {
	m.TotalAmount = float64(m.ValidAttendance) * m.AmountPerDay
}

// CanUserClaim checks if user can claim meal allowance for the given month/year
func CanUserClaim(db *gorm.DB, userID uuid.UUID, month, year int) bool {
	var count int64
	db.Model(&MealAllowanceClaim{}).Where("user_id = ? AND month = ? AND year = ?", userID, month, year).Count(&count)
	return count == 0
}

// GetValidAttendanceCount counts valid attendance for a user in a specific month/year
func GetValidAttendanceCount(db *gorm.DB, userID uuid.UUID, month, year int) (int, int) {
	var totalCount, validCount int64
	
	// Count total attendance
	db.Model(&Attendance{}).Where(
		"user_id = ? AND EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ?",
		userID, month, year,
	).Count(&totalCount)
	
	// Count valid attendance (with checkout and minimum working hours)
	db.Model(&Attendance{}).Where(
		"user_id = ? AND EXTRACT(MONTH FROM check_in_time) = ? AND EXTRACT(YEAR FROM check_in_time) = ? AND check_out_time IS NOT NULL AND is_valid = true",
		userID, month, year,
	).Count(&validCount)
	
	return int(totalCount), int(validCount)
}