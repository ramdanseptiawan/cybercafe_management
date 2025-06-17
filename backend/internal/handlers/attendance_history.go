package handlers

import (
	"fmt"
	"strconv"
	"time"

	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetAttendanceHistory returns filtered attendance history with advanced filtering options
func (h *AttendanceHandler) GetAttendanceHistory(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	userIDStr := c.Query("user_id", "")
	month := c.Query("month", "")
	date := c.Query("date", "")
	year := c.Query("year", "")

	offset := (page - 1) * limit

	// Base query with preloads
	query := h.db.Preload("User").Preload("User.Role")

	// Apply filters
	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format", err)
		}
		query = query.Where("user_id = ?", userID)
	}

	// Filter by specific date
	if date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid date format. Use YYYY-MM-DD", err)
		}
		query = query.Where("DATE(check_in_time) = ?", parsedDate.Format("2006-01-02"))
	}

	// Filter by month (YYYY-MM format)
	if month != "" {
		_, err := time.Parse("2006-01", month)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid month format. Use YYYY-MM", err)
		}
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	}

	// Filter by year
	if year != "" {
		yearInt, err := strconv.Atoi(year)
		if err != nil || yearInt < 2000 || yearInt > 3000 {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year format", err)
		}
		query = query.Where("EXTRACT(YEAR FROM check_in_time) = ?", yearInt)
	}

	// Get total count for pagination
	var total int64
	query.Model(&models.Attendance{}).Count(&total)

	// Get attendance records
	var attendances []models.Attendance
	if err := query.Order("check_in_time DESC").Offset(offset).Limit(limit).Find(&attendances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attendance records", err)
	}

	// Transform data to include calculated fields
	var records []map[string]interface{}
	for _, att := range attendances {
		// Calculate working hours
		workingHours := 0.0
		if att.CheckOutTime != nil {
			workingHours = att.CheckOutTime.Sub(att.CheckInTime).Hours()
		}

		// Determine status
		status := "present"
		checkInTime := att.CheckInTime
		
		// Check if late (after 9 AM)
		if checkInTime.Hour() > 9 || (checkInTime.Hour() == 9 && checkInTime.Minute() > 0) {
			status = "late"
		}
		
		// Check if incomplete (not checked out or working hours < 8)
		if att.CheckOutTime == nil || workingHours < 8 {
			status = "incomplete"
		}

		// Apply status filter if specified
		if c.Query("status") != "" && status != c.Query("status") {
			continue
		}

		record := map[string]interface{}{
			"id":                     att.ID,
			"user_id":                att.UserID,
			"user_name":              att.User.Name,
			"user_email":             att.User.Email,
			"check_in_time":          att.CheckInTime,
			"check_out_time":         att.CheckOutTime,
			"working_hours":          workingHours,
			"status":                 status,
			"notes":                  att.Notes,
			"date":                   att.CheckInTime.Format("2006-01-02"),
			"is_valid":               att.IsValid,
			"distance":               att.Distance,
			"address":                att.Address,
			"photo_path":             att.PhotoPath,
			"check_out_photo_path":   att.CheckOutPhotoPath,
			"user":                   att.User,
		}

		records = append(records, record)
	}

	// If status filter was applied, we need to recalculate pagination
	if c.Query("status") != "" {
		total = int64(len(records))
		// Apply pagination to filtered results
		start := offset
		end := offset + limit
		if start > len(records) {
			records = []map[string]interface{}{}
		} else {
			if end > len(records) {
				end = len(records)
			}
			records = records[start:end]
		}
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	return utils.PaginatedSuccessResponse(c, "Attendance history retrieved successfully", records, meta)
}

// GetAttendanceStatsByPeriod returns attendance statistics for a specific period
func (h *AttendanceHandler) GetAttendanceStatsByPeriod(c *fiber.Ctx) error {
	userIDStr := c.Query("user_id", "")
	month := c.Query("month", time.Now().Format("2006-01"))
	year := c.Query("year", strconv.Itoa(time.Now().Year()))

	query := h.db.Model(&models.Attendance{})

	// Apply filters
	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format", err)
		}
		query = query.Where("user_id = ?", userID)
	}

	// Filter by month if provided
	if month != "" {
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	} else if year != "" {
		yearInt, err := strconv.Atoi(year)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year format", err)
		}
		query = query.Where("EXTRACT(YEAR FROM check_in_time) = ?", yearInt)
	}

	// Get all records for calculation
	var attendances []models.Attendance
	if err := query.Find(&attendances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attendance records", err)
	}

	// Calculate statistics
	totalDays := len(attendances)
	presentDays := 0
	lateDays := 0
	incompleteDays := 0
	totalWorkingHours := 0.0

	for _, att := range attendances {
		workingHours := 0.0
		if att.CheckOutTime != nil {
			workingHours = att.CheckOutTime.Sub(att.CheckInTime).Hours()
			totalWorkingHours += workingHours
		}

		checkInTime := att.CheckInTime
		isLate := checkInTime.Hour() > 9 || (checkInTime.Hour() == 9 && checkInTime.Minute() > 0)
		isIncomplete := att.CheckOutTime == nil || workingHours < 8

		if isIncomplete {
			incompleteDays++
		} else if isLate {
			lateDays++
		} else {
			presentDays++
		}
	}

	// Calculate averages
	averageWorkingHours := 0.0
	if totalDays > 0 {
		averageWorkingHours = totalWorkingHours / float64(totalDays)
	}

	attendanceRate := 0.0
	if totalDays > 0 {
		attendanceRate = float64(presentDays+lateDays) / float64(totalDays) * 100
	}

	stats := map[string]interface{}{
		"total_days":            totalDays,
		"present_days":          presentDays,
		"late_days":             lateDays,
		"incomplete_days":       incompleteDays,
		"total_working_hours":   totalWorkingHours,
		"average_working_hours": averageWorkingHours,
		"attendance_rate":       attendanceRate,
		"period":                map[string]string{"month": month, "year": year},
	}

	return utils.SuccessResponse(c, "Attendance statistics retrieved successfully", stats)
}

// ExportAttendanceHistory exports attendance data to CSV format
func (h *AttendanceHandler) ExportAttendanceHistory(c *fiber.Ctx) error {
	// Get the same filters as GetAttendanceHistory
	userIDStr := c.Query("user_id", "")
	month := c.Query("month", "")
	date := c.Query("date", "")
	year := c.Query("year", "")

	// Base query
	query := h.db.Preload("User").Preload("User.Role")

	// Apply the same filters as GetAttendanceHistory
	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format", err)
		}
		query = query.Where("user_id = ?", userID)
	}

	if date != "" {
		parsedDate, err := time.Parse("2006-01-02", date)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid date format", err)
		}
		query = query.Where("DATE(check_in_time) = ?", parsedDate.Format("2006-01-02"))
	}

	if month != "" {
		query = query.Where("TO_CHAR(check_in_time, 'YYYY-MM') = ?", month)
	}

	if year != "" {
		yearInt, err := strconv.Atoi(year)
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid year format", err)
		}
		query = query.Where("EXTRACT(YEAR FROM check_in_time) = ?", yearInt)
	}

	// Get all records (no pagination for export)
	var attendances []models.Attendance
	if err := query.Order("check_in_time DESC").Find(&attendances).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch attendance records", err)
	}

	// Set headers for CSV download
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=attendance_history.csv")

	// Create CSV content
	csvContent := "Name,Email,Date,Check In,Check Out,Working Hours,Status,Notes\n"

	for _, att := range attendances {
		workingHours := 0.0
		if att.CheckOutTime != nil {
			workingHours = att.CheckOutTime.Sub(att.CheckInTime).Hours()
		}

		status := "present"
		checkInTime := att.CheckInTime
		if checkInTime.Hour() > 9 || (checkInTime.Hour() == 9 && checkInTime.Minute() > 0) {
			status = "late"
		}
		if att.CheckOutTime == nil || workingHours < 8 {
			status = "incomplete"
		}

		// Apply status filter if specified
		if c.Query("status") != "" && status != c.Query("status") {
			continue
		}

		checkOutTime := "-"
		if att.CheckOutTime != nil {
			checkOutTime = att.CheckOutTime.Format("15:04")
		}

		notes := att.Notes

		csvContent += fmt.Sprintf("%s,%s,%s,%s,%s,%.2f,%s,\"%s\"\n",
			att.User.Name,
			att.User.Email,
			att.CheckInTime.Format("2006-01-02"),
			att.CheckInTime.Format("15:04"),
			checkOutTime,
			workingHours,
			status,
			notes,
		)
	}

	return c.SendString(csvContent)
}