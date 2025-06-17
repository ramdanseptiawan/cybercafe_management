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
	mealAllowanceHandler := handlers.NewMealAllowanceHandler(db, cfg)
	dashboardHandler := handlers.NewDashboardHandler(db, cfg)

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

	// Attendance routes
	attendance := protected.Group("/attendance")
	attendance.Post("/check-in", attendanceHandler.CheckIn)
	attendance.Post("/check-out", attendanceHandler.CheckOut)
	attendance.Get("/my", attendanceHandler.GetMyAttendance)
	attendance.Get("/all", attendanceHandler.GetAllAttendance)
	attendance.Get("/stats", attendanceHandler.GetAttendanceStats)
	attendance.Get("/today", attendanceHandler.GetTodayAttendance)
	attendance.Get("/employee/:userId/detail", attendanceHandler.GetEmployeeAttendanceDetail)
	attendance.Get("/history", attendanceHandler.GetAttendanceHistory)
	attendance.Get("/history/stats", attendanceHandler.GetAttendanceStatsByPeriod)
	attendance.Get("/history/export", attendanceHandler.ExportAttendanceHistory)
	attendance.Put("/:id", attendanceHandler.UpdateAttendance)
	attendance.Delete("/:id", attendanceHandler.DeleteAttendance)

	// Location routes under attendance (sesuai dokumentasi API)
	attendance.Get("/locations", locationHandler.GetAllLocations)
	attendance.Post("/locations", locationHandler.CreateLocation)
	attendance.Get("/locations/nearby", locationHandler.GetNearbyLocations)
	attendance.Post("/locations/validate", locationHandler.ValidateLocation)
	attendance.Get("/locations/:id", locationHandler.GetLocationByID)
	attendance.Put("/locations/:id", locationHandler.UpdateLocation)
	attendance.Delete("/locations/:id", locationHandler.DeleteLocation)

	// Audit routes
	audit := protected.Group("/audit")
	audit.Get("/", auditHandler.GetAuditLogs)

	// Meal Allowance routes
	mealAllowance := protected.Group("/meal-allowance")
	mealAllowance.Get("/preview", mealAllowanceHandler.GetMealAllowancePreview)
	mealAllowance.Post("/claim", mealAllowanceHandler.ClaimMealAllowance)
	mealAllowance.Get("/my", mealAllowanceHandler.GetMyMealAllowances)
	mealAllowance.Get("/all", mealAllowanceHandler.GetAllMealAllowances)
	mealAllowance.Put("/:id/approve", mealAllowanceHandler.ApproveMealAllowance)
	mealAllowance.Put("/:id/reject", mealAllowanceHandler.RejectMealAllowance)
	mealAllowance.Put("/:id/claim-status", mealAllowanceHandler.UpdateMealAllowanceClaimStatus)
	mealAllowance.Post("/direct-approve", mealAllowanceHandler.DirectApproveMealAllowance)
	mealAllowance.Get("/policy", mealAllowanceHandler.GetMealAllowancePolicy)
	mealAllowance.Put("/policy", mealAllowanceHandler.UpdateMealAllowancePolicy)
	mealAllowance.Get("/management", attendanceHandler.GetMealAllowanceManagement)
	mealAllowance.Get("/stats", mealAllowanceHandler.GetMealAllowanceStats)

	// Dashboard routes
	dashboard := protected.Group("/dashboard")
	dashboard.Get("/employee", dashboardHandler.GetEmployeeDashboard)
	dashboard.Get("/employee/summary", dashboardHandler.GetEmployeeSummary)
}