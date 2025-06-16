package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	Username     string    `json:"username" gorm:"uniqueIndex;not null"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	Password     string    `json:"-" gorm:"not null"`
	Name         string    `json:"name" gorm:"not null"`
	Phone        string    `json:"phone"`
	Address      string    `json:"address"`
	KTPNumber    string    `json:"ktp_number" gorm:"uniqueIndex"`
	EmployeeID   string    `json:"employee_id" gorm:"uniqueIndex"`
	RoleID       uuid.UUID `json:"role_id" gorm:"type:char(36);not null"`
	Role         Role      `json:"role" gorm:"foreignKey:RoleID"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}

func (u *User) SetPassword(password string) error {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashed)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

type UserResponse struct {
	ID         uuid.UUID `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	Phone      string    `json:"phone"`
	Address    string    `json:"address"`
	KTPNumber  string    `json:"ktp_number"`
	EmployeeID string    `json:"employee_id"`
	Role       Role      `json:"role"`
	IsActive   bool      `json:"is_active"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:         u.ID,
		Username:   u.Username,
		Email:      u.Email,
		Name:       u.Name,
		Phone:      u.Phone,
		Address:    u.Address,
		KTPNumber:  u.KTPNumber,
		EmployeeID: u.EmployeeID,
		Role:       u.Role,
		IsActive:   u.IsActive,
	}
}