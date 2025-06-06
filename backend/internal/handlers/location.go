package handlers

import (
	"fmt"
	"math"
	"strconv"

	"cybercafe-backend/internal/models"
	"cybercafe-backend/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LocationHandler struct {
	db *gorm.DB
}

func NewLocationHandler(db *gorm.DB) *LocationHandler {
	return &LocationHandler{db: db}
}

type CreateLocationRequest struct {
	Name         string  `json:"name" validate:"required"`
	Address      string  `json:"address"`
	Latitude     float64 `json:"latitude" validate:"required"`
	Longitude    float64 `json:"longitude" validate:"required"`
	Radius       int     `json:"radius"`
	Type         string  `json:"type"`
	WorkingHours string  `json:"working_hours"`
	Timezone     string  `json:"timezone"`
}

type UpdateLocationRequest struct {
	Name         string  `json:"name"`
	Address      string  `json:"address"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Radius       int     `json:"radius"`
	Type         string  `json:"type"`
	IsActive     *bool   `json:"is_active"`
	WorkingHours string  `json:"working_hours"`
	Timezone     string  `json:"timezone"`
}

type NearbyLocationRequest struct {
	Latitude  float64 `json:"latitude" validate:"required"`
	Longitude float64 `json:"longitude" validate:"required"`
	Radius    int     `json:"radius"` // search radius in meters
}

// CreateLocation creates a new location
func (h *LocationHandler) CreateLocation(c *fiber.Ctx) error {
	var req CreateLocationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	userID := c.Locals("user_id").(uuid.UUID)

	location := models.Location{
		Name:         req.Name,
		Address:      req.Address,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		Radius:       req.Radius,
		Type:         req.Type,
		WorkingHours: req.WorkingHours,
		Timezone:     req.Timezone,
		CreatedBy:    userID.String(),
	}

	// Set defaults
	if location.Radius == 0 {
		location.Radius = 100
	}
	if location.Type == "" {
		location.Type = "office"
	}
	if location.Timezone == "" {
		location.Timezone = "Asia/Jakarta"
	}

	if err := h.db.Create(&location).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create location", err)
	}

	return utils.SuccessResponse(c, "Location created successfully", location.ToResponse())
}

// GetAllLocations retrieves all locations with pagination
func (h *LocationHandler) GetAllLocations(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	locationTypeFilter := c.Query("type", "")
	isActiveFilter := c.Query("is_active", "")

	offset := (page - 1) * limit

	query := h.db.Model(&models.Location{})

	if locationTypeFilter != "" {
		query = query.Where("type = ?", locationTypeFilter)
	}

	if isActiveFilter != "" {
		isActive, _ := strconv.ParseBool(isActiveFilter)
		query = query.Where("is_active = ?", isActive)
	}

	var total int64
	query.Count(&total)

	var locations []models.Location
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&locations).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch locations", err)
	}

	// Convert to response format
	var responses []models.LocationResponse
	for _, location := range locations {
		responses = append(responses, location.ToResponse())
	}

	meta := utils.PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: int((total + int64(limit) - 1) / int64(limit)),
	}

	return utils.PaginatedSuccessResponse(c, "Locations retrieved successfully", responses, meta)
}

// GetLocationByID retrieves a location by ID
func (h *LocationHandler) GetLocationByID(c *fiber.Ctx) error {
	id := c.Params("id")
	locationID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid location ID", err)
	}

	var location models.Location
	if err := h.db.Where("id = ?", locationID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Location not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch location", err)
	}

	return utils.SuccessResponse(c, "Location retrieved successfully", location.ToResponse())
}

// UpdateLocation updates a location
func (h *LocationHandler) UpdateLocation(c *fiber.Ctx) error {
	id := c.Params("id")
	locationID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid location ID", err)
	}

	var req UpdateLocationRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	var location models.Location
	if err := h.db.Where("id = ?", locationID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Location not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch location", err)
	}

	// Update fields
	if req.Name != "" {
		location.Name = req.Name
	}
	if req.Address != "" {
		location.Address = req.Address
	}
	if req.Latitude != 0 {
		location.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		location.Longitude = req.Longitude
	}
	if req.Radius != 0 {
		location.Radius = req.Radius
	}
	if req.Type != "" {
		location.Type = req.Type
	}
	if req.IsActive != nil {
		location.IsActive = *req.IsActive
	}
	if req.WorkingHours != "" {
		location.WorkingHours = req.WorkingHours
	}
	if req.Timezone != "" {
		location.Timezone = req.Timezone
	}

	if err := h.db.Save(&location).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update location", err)
	}

	return utils.SuccessResponse(c, "Location updated successfully", location.ToResponse())
}

// DeleteLocation deletes a location
func (h *LocationHandler) DeleteLocation(c *fiber.Ctx) error {
	id := c.Params("id")
	locationID, err := uuid.Parse(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid location ID", err)
	}

	var location models.Location
	if err := h.db.Where("id = ?", locationID).First(&location).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Location not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch location", err)
	}

	if err := h.db.Delete(&location).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete location", err)
	}

	return utils.SuccessResponse(c, "Location deleted successfully", nil)
}

// GetNearbyLocations finds locations within specified radius
func (h *LocationHandler) GetNearbyLocations(c *fiber.Ctx) error {
	latStr := c.Query("latitude")
	lngStr := c.Query("longitude")
	radiusStr := c.Query("radius", "1000") // default 1km

	if latStr == "" || lngStr == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Latitude and longitude are required", nil)
	}

	latitude, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid latitude format", err)
	}

	longitude, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid longitude format", err)
	}

	radius, err := strconv.Atoi(radiusStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid radius format", err)
	}

	var locations []models.Location
	if err := h.db.Where("is_active = ?", true).Find(&locations).Error; err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch locations", err)
	}

	type NearbyLocation struct {
		models.LocationResponse
		Distance        float64 `json:"distance"`
		IsWithinRadius  bool    `json:"is_within_radius"`
	}

	var nearbyLocations []NearbyLocation
	for _, location := range locations {
		distance := calculateDistance(latitude, longitude, location.Latitude, location.Longitude)
		isWithinRadius := distance <= float64(radius)

		nearbyLocation := NearbyLocation{
			LocationResponse: location.ToResponse(),
			Distance:         distance,
			IsWithinRadius:   isWithinRadius,
		}

		nearbyLocations = append(nearbyLocations, nearbyLocation)
	}

	return utils.SuccessResponse(c, "Nearby locations retrieved successfully", nearbyLocations)
}

// ValidateLocation validates if current location is within allowed radius
func (h *LocationHandler) ValidateLocation(c *fiber.Ctx) error {
	// LOG: Endpoint validation dipanggil
	fmt.Printf("[LOCATION VALIDATION] Endpoint /locations/validate dipanggil dari IP: %s\n", c.IP())
	
	var req NearbyLocationRequest
	if err := c.BodyParser(&req); err != nil {
		fmt.Printf("[LOCATION VALIDATION ERROR] Invalid request body: %v\n", err)
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body", err)
	}

	// LOG: Koordinat yang diterima
	fmt.Printf("[LOCATION VALIDATION] Koordinat diterima - Lat: %f, Lng: %f\n", req.Latitude, req.Longitude)

	var locations []models.Location
	if err := h.db.Where("is_active = ?", true).Find(&locations).Error; err != nil {
		fmt.Printf("[LOCATION VALIDATION ERROR] Failed to fetch locations: %v\n", err)
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch locations", err)
	}

	// LOG: Jumlah lokasi aktif yang ditemukan
	fmt.Printf("[LOCATION VALIDATION] Ditemukan %d lokasi aktif untuk validasi\n", len(locations))

	type ValidationResult struct {
		IsValid  bool                    `json:"is_valid"`
		Location *models.LocationResponse `json:"location,omitempty"`
		Distance float64                 `json:"distance,omitempty"`
		Message  string                  `json:"message"`
	}

	for i, location := range locations {
		distance := calculateDistance(req.Latitude, req.Longitude, location.Latitude, location.Longitude)
		// LOG: Detail perhitungan jarak untuk setiap lokasi
		fmt.Printf("[LOCATION VALIDATION] Lokasi %d (%s): Jarak = %.2fm, Radius = %dm\n", i+1, location.Name, distance, location.Radius)
		
		if distance <= float64(location.Radius) {
			fmt.Printf("[LOCATION VALIDATION SUCCESS] User berada dalam radius lokasi: %s\n", location.Name)
			locationResponse := location.ToResponse()
			result := ValidationResult{
				IsValid:  true,
				Location: &locationResponse,
				Distance: distance,
				Message:  "Location is valid for attendance",
			}
			return utils.SuccessResponse(c, "Location validation successful", result)
		}
	}

	fmt.Printf("[LOCATION VALIDATION FAILED] User tidak berada dalam radius lokasi manapun\n")
	result := ValidationResult{
		IsValid: false,
		Message: "Location is not within any allowed radius",
	}

	return utils.SuccessResponse(c, "Location validation completed", result)
}

// calculateDistance calculates the distance between two coordinates using Haversine formula
func calculateDistance(lat1, lng1, lat2, lng2 float64) float64 {
    // Validasi koordinat
    if lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 {
        return 0 // atau return error
    }
    if lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180 {
        return 0 // atau return error
    }
    
    const earthRadius = 6371000 // Earth radius in meters

    // Convert degrees to radians
    lat1Rad := lat1 * math.Pi / 180
    lng1Rad := lng1 * math.Pi / 180
    lat2Rad := lat2 * math.Pi / 180
    lng2Rad := lng2 * math.Pi / 180

    // Haversine formula
    dlat := lat2Rad - lat1Rad
    dlng := lng2Rad - lng1Rad

    a := math.Sin(dlat/2)*math.Sin(dlat/2) + math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dlng/2)*math.Sin(dlng/2)
    c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

    result := earthRadius * c
    if math.IsNaN(result) || math.IsInf(result, 0) {
        return 0
    }
    return result
}