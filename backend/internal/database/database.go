package database

import (
	"fmt"
	"log"

	"cybercafe-backend/internal/config"
	"cybercafe-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Initialize(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	if err := autoMigrate(db); err != nil {
		return nil, err
	}

	// Seed initial data
	if err := seedData(db); err != nil {
		log.Println("Warning: Failed to seed data:", err)
	}

	return db, nil
}

func autoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.AuditLog{},
		&models.Attendance{},
		&models.Location{},
	)
}

func seedData(db *gorm.DB) error {
	// Create default roles
	roles := []models.Role{
		{Name: "admin", Description: "Administrator with full access", Permissions: `["all"]`},
		{Name: "employee", Description: "Regular employee", Permissions: `["attendance.read", "attendance.write.own"]`},
		{Name: "manager", Description: "Manager with limited admin access", Permissions: `["staff.read", "attendance.read", "reports.read"]`},
	}

	for _, role := range roles {
		var existingRole models.Role
		if err := db.Where("name = ?", role.Name).First(&existingRole).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&role).Error; err != nil {
					return err
				}
			}
		}
	}

	// Create default admin user
	var adminRole models.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}

	var existingAdmin models.User
	if err := db.Where("username = ?", "admin").First(&existingAdmin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			adminUser := models.User{
				Username: "admin",
				Email:    "admin@cybercafe.com",
				Name:     "System Administrator",
				RoleID:   adminRole.ID,
				IsActive: true,
			}
			
			// Set default password: "admin123"
			if err := adminUser.SetPassword("admin123"); err != nil {
				return err
			}
			
			if err := db.Create(&adminUser).Error; err != nil {
				return err
			}
			
			log.Println("Default admin user created:")
			log.Println("Username: admin")
			log.Println("Password: admin123")
			log.Println("Please change the password after first login!")
		}
	}

	// Create default locations
	locations := []models.Location{
		{
			Name:         "Main Office",
			Address:      "Jl. Sudirman No. 123, Jakarta Pusat",
			Latitude:     -6.2088,
			Longitude:    106.8456,
			Radius:       100,
			Type:         "office",
			WorkingHours: `{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}`,
			Timezone:     "Asia/Jakarta",
			CreatedBy:    "system",
		},
		{
			Name:         "Branch Surabaya",
			Address:      "Jl. Pemuda No. 456, Surabaya",
			Latitude:     -7.2575,
			Longitude:    112.7521,
			Radius:       150,
			Type:         "branch",
			WorkingHours: `{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5]}`,
			Timezone:     "Asia/Jakarta",
			CreatedBy:    "system",
		},
		{
			Name:         "Remote Work",
			Address:      "Work from Home",
			Latitude:     0,
			Longitude:    0,
			Radius:       0,
			Type:         "remote",
			WorkingHours: `{"start": "08:00", "end": "17:00", "days": [1,2,3,4,5,6,7]}`,
			Timezone:     "Asia/Jakarta",
			CreatedBy:    "system",
		},
	}

	for _, location := range locations {
		var existingLocation models.Location
		if err := db.Where("name = ?", location.Name).First(&existingLocation).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&location).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}