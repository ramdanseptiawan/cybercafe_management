package routes

import (
	"cybercafe-backend/internal/config"
	"cybercafe-backend/internal/handlers"
	"cybercafe-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	staffHandler := handlers.NewStaffHandler(db)
	roleHandler := handlers.NewRoleHandler(db)
	attendanceHandler := handlers.NewAttendanceHandler(db, cfg)
	auditHandler := handlers.NewAuditHandler(db)
	locationHandler := handlers.NewLocationHandler(db)

	// Initialize middleware
	authMiddleware := middleware.AuthRequired(cfg)
	auditMiddleware := middleware.AuditLogger(db)

	// API routes
	api := app.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/logout", authMiddleware, authHandler.Logout)
	auth.Get("/me", authMiddleware, authHandler.GetProfile)

	// Protected routes
	protected := api.Group("", authMiddleware, auditMiddleware)

	// Staff routes
	staff := protected.Group("/staff")
	staff.Get("/", staffHandler.GetAllStaff)
	staff.Post("/", staffHandler.CreateStaff)
	staff.Get("/:id", staffHandler.GetStaffByID)
	staff.Put("/:id", staffHandler.UpdateStaff)
	staff.Delete("/:id", staffHandler.DeleteStaff)

	// Role routes
	roles := protected.Group("/roles")
	roles.Get("/", roleHandler.GetAllRoles)
	roles.Post("/", roleHandler.CreateRole)
	roles.Get("/:id", roleHandler.GetRoleByID)
	roles.Put("/:id", roleHandler.UpdateRole)
	roles.Delete("/:id", roleHandler.DeleteRole)

	// Location routes
	locations := protected.Group("/locations")
	locations.Get("/", locationHandler.GetAllLocations)
	locations.Post("/", locationHandler.CreateLocation)
	locations.Get("/nearby", locationHandler.GetNearbyLocations)
	locations.Post("/validate", locationHandler.ValidateLocation)
	locations.Get("/:id", locationHandler.GetLocationByID)
	locations.Put("/:id", locationHandler.UpdateLocation)
	locations.Delete("/:id", locationHandler.DeleteLocation)

	// Attendance routes
	attendance := protected.Group("/attendance")
	attendance.Post("/check-in", attendanceHandler.CheckIn)
	attendance.Post("/check-out", attendanceHandler.CheckOut)
	attendance.Get("/my", attendanceHandler.GetMyAttendance)
	attendance.Get("/all", attendanceHandler.GetAllAttendance)
	attendance.Get("/stats", attendanceHandler.GetAttendanceStats)
	attendance.Get("/today", attendanceHandler.GetTodayAttendance)
	attendance.Put("/:id", attendanceHandler.UpdateAttendance)
	attendance.Delete("/:id", attendanceHandler.DeleteAttendance)

	// Audit routes
	audit := protected.Group("/audit")
	audit.Get("/", auditHandler.GetAuditLogs)
}