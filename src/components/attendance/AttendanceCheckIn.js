"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Clock, AlertCircle, CheckCircle, Navigation, Wifi } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import CameraCapture from './CameraCapture';
import { attendanceService } from '../../services/attendanceService';
import { locationService } from '../../services/locationService';

const AttendanceCheckIn = ({ employee, onSubmit, allowedLocations = [] }) => {
  const [step, setStep] = useState('location');
  const [attendanceData, setAttendanceData] = useState({
    photo: null,
    location: null,
    timestamp: null,
    type: 'check-in'
  });
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationValidation, setLocationValidation] = useState(null);
  const [locations, setLocations] = useState([]);

  const { 
    location, 
    loading: locationLoading, 
    error: locationError, 
    getCurrentLocation, 
    validateMultipleLocations 
  } = useGeolocation();

  // Fetch allowed locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationService.getAllLocations({ is_active: true });
        if (response.success) {
          setLocations(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
      }
    };
    
    fetchLocations();
  }, []);

  const handleLocationCapture = async () => {
    setLoading(true);
    setError(null);
    setLocationValidation(null);
    
    try {
      const locationData = await getCurrentLocation();
      
      // DEBUG: Log koordinat user
      console.log('User coordinates:', {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy
      });
      
      // Validate location with API
      const validationResponse = await locationService.validateLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy
      });
      
      // DEBUG: Log response dari server
      console.log('Validation response:', validationResponse);
      
      if (validationResponse.success && validationResponse.data.is_valid) {
        setLocationValidation({
          isValid: true,
          nearestLocation: validationResponse.data.location,
          distance: validationResponse.data.location.distance,
          effectiveRadius: validationResponse.data.rules.max_distance
        });
        
        setAttendanceData(prev => ({
          ...prev,
          location: {
            ...locationData,
            locationId: validationResponse.data.location.id
          },
          timestamp: new Date().toISOString()
        }));
        
        setStep('camera');
        setShowCamera(true);
      } else {
        const nearestDistance = Math.round(validationResponse.data.location?.distance || 0);
        const nearestLocationName = validationResponse.data.location?.name || 'authorized location';
        const effectiveRadius = validationResponse.data.rules?.max_distance || 100;
        
        setLocationValidation({
          isValid: false,
          nearestLocation: validationResponse.data.location,
          distance: nearestDistance,
          effectiveRadius
        });
        
        setError(
          `You are ${nearestDistance}m away from ${nearestLocationName}. ` +
          `Please move within ${Math.round(effectiveRadius)}m radius for check-in. ` +
          `(GPS accuracy: ±${Math.round(locationData.accuracy || 0)}m)`
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to validate location');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (captureData) => {
    setAttendanceData(prev => ({
      ...prev,
      photo: captureData.photo,
      location: captureData.location || prev.location,
      timestamp: captureData.timestamp || prev.timestamp
    }));
    setShowCamera(false);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Convert base64 to blob
      const photoBlob = await fetch(attendanceData.photo).then(r => r.blob());
      formData.append('photo', photoBlob, 'check-in.jpg');
      
      // Add location data
      formData.append('latitude', attendanceData.location.latitude);
      formData.append('longitude', attendanceData.location.longitude);
      formData.append('distance', locationValidation.distance);
      formData.append('isValid', locationValidation.isValid);
      formData.append('address', attendanceData.location.address);
      
      // Add notes if any
      if (attendanceData.notes) {
        formData.append('notes', attendanceData.notes);
      }
      
      const response = await attendanceService.checkIn(formData);
      
      if (response.success) {
        onSubmit({
          ...attendanceData,
          id: response.data.id,
          employeeId: employee.id,
          employeeName: employee.name,
          locationValidation: locationValidation,
          serverResponse: response.data
        });
      } else {
        throw new Error(response.message || 'Failed to submit attendance');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('location');
    setAttendanceData({
      photo: null,
      location: null,
      timestamp: null,
      type: 'check-in'
    });
    setShowCamera(false);
    setError(null);
    setLocationValidation(null);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handlePhotoCapture}
        onCancel={() => setShowCamera(false)}
        autoCapture={false}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check In</h2>
        <p className="text-gray-600">Welcome, {employee.name}</p>
        <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Location Validation Info */}
      {locationValidation && (
        <div className={`border rounded-lg p-4 mb-4 ${
          locationValidation.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-2">
            <Navigation className={`flex-shrink-0 mt-0.5 ${
              locationValidation.isValid ? 'text-green-600' : 'text-yellow-600'
            }`} size={20} />
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                locationValidation.isValid ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {locationValidation.isValid 
                  ? '✓ Location Verified' 
                  : `${Math.round(locationValidation.distance)}m from nearest location`
                }
              </p>
              {locationValidation.nearestLocation && (
                <p className="text-xs text-gray-600 mt-1">
                  Nearest: {locationValidation.nearestLocation.name}
                </p>
              )}
              {locationValidation.currentLocation && (
                <div className="flex items-center gap-1 mt-1">
                  <Wifi className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    GPS accuracy: ±{Math.round(locationValidation.currentLocation.accuracy || 0)}m
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Location */}
      {step === 'location' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <MapPin className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Location</h3>
            <p className="text-gray-600 text-sm mb-4">
              We need to verify your location for attendance
            </p>
            
            {/* Show allowed locations */}
            {allowedLocations.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Authorized Locations:</p>
                <div className="space-y-1">
                  {allowedLocations.map((loc, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {loc.name} (±{loc.radius || 100}m radius)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLocationCapture}
            disabled={loading || locationLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading || locationLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Capture Location
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <CheckCircle className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Attendance</h3>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Location
            </h4>
            <p className="text-sm text-gray-600">{attendanceData.location?.address}</p>
            <p className="text-xs text-gray-500">
              Lat: {attendanceData.location?.latitude?.toFixed(6)}, 
              Lng: {attendanceData.location?.longitude?.toFixed(6)}
            </p>
            {locationValidation && (
              <p className={`text-xs mt-1 ${
                locationValidation.isValid ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {locationValidation.isValid 
                  ? '✓ Location verified' 
                  : `⚠ ${Math.round(locationValidation.distance)}m from authorized area`
                }
              </p>
            )}
          </div>

          {/* Photo Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Camera size={16} />
              Photo
            </h4>
            <img
              src={attendanceData.photo}
              alt="Attendance photo"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>

          {/* Time Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Time
            </h4>
            <p className="text-sm text-gray-600">
              {new Date(attendanceData.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Check In
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCheckIn;