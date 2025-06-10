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

  // Tambahkan state untuk address
  const [currentAddress, setCurrentAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Fungsi untuk mendapatkan address dari koordinat menggunakan Nominatim (gratis)
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setLoadingAddress(true);
      
      // Menggunakan Nominatim OpenStreetMap (gratis, tanpa API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CyberCafe-Management-App' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Gagal mendapatkan data lokasi');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Format address yang lebih ringkas
        const address = data.address;
        let formattedAddress = '';
        
        if (address) {
          const parts = [];
          if (address.road) parts.push(address.road);
          if (address.suburb || address.village) parts.push(address.suburb || address.village);
          if (address.city || address.town) parts.push(address.city || address.town);
          if (address.state) parts.push(address.state);
          
          formattedAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
        } else {
          formattedAddress = data.display_name;
        }
        
        return formattedAddress;
      }
      
      return 'Alamat tidak ditemukan';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Gagal mendapatkan alamat';
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleLocationCapture = async () => {
    setLoading(true);
    setError(null);
    setLocationValidation(null);
    
    try {
      const locationData = await getCurrentLocation();
      
      // Dapatkan address dari koordinat
      const address = await getAddressFromCoordinates(
        locationData.latitude, 
        locationData.longitude
      );
      setCurrentAddress(address);
      
      // DEBUG: Log koordinat user dan address
      console.log('User location:', {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          address: address
      });
      
      // Validate location with API
      const validationResponse = await locationService.validateLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        address: address // Kirim address ke backend
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
            locationId: validationResponse.data.location.id,
            address: address // Simpan address dalam attendance data
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

      {/* CARD BARU: Informasi Lokasi Real-time - Selalu tampil setelah capture */}
      {(attendanceData.location || location || currentAddress || loadingAddress || locationLoading) && (
        <div className="border border-purple-200 rounded-lg p-4 mb-4 bg-purple-50">
          <div className="flex items-start gap-2">
            <MapPin className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                📍 Informasi Lokasi Anda
              </h4>
              
              {/* Status Loading */}
              {(locationLoading || loadingAddress) && (
                <div className="mb-3 p-2 bg-white rounded border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-purple-700">
                      {locationLoading ? 'Mengambil koordinat GPS...' : 'Mengambil alamat...'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Koordinat GPS */}
              {(location || attendanceData.location) && (
                <div className="mb-3 p-3 bg-white rounded border border-purple-200">
                  <p className="text-sm font-medium text-purple-800 mb-2">🌐 Koordinat GPS:</p>
                  <div className="space-y-1">
                    <p className="text-sm text-purple-700 font-mono bg-purple-100 p-2 rounded">
                      Latitude: {(location?.latitude || attendanceData.location?.latitude)?.toFixed(6)}
                    </p>
                    <p className="text-sm text-purple-700 font-mono bg-purple-100 p-2 rounded">
                      Longitude: {(location?.longitude || attendanceData.location?.longitude)?.toFixed(6)}
                    </p>
                    {(location?.accuracy || attendanceData.location?.accuracy) && (
                      <p className="text-xs text-purple-600 mt-1">
                        🎯 Akurasi: ±{Math.round(location?.accuracy || attendanceData.location?.accuracy)}m
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Alamat */}
              <div className="p-3 bg-white rounded border border-purple-200">
                <p className="text-sm font-medium text-purple-800 mb-2">🏠 Alamat Lengkap:</p>
                {loadingAddress ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-purple-600">Sedang mengambil alamat...</span>
                  </div>
                ) : (
                  <p className="text-sm text-purple-700 bg-purple-100 p-2 rounded leading-relaxed">
                    {currentAddress || attendanceData.location?.address || 'Alamat belum tersedia'}
                  </p>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="mt-2 text-xs text-purple-600">
                ⏰ Diambil pada: {new Date().toLocaleString('id-ID')}
              </div>
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
            
            {/* Debug Info - Tampilkan state saat ini */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
              <p className="text-xs font-medium text-yellow-800 mb-2">🔧 Debug Info:</p>
              <div className="space-y-1 text-xs text-yellow-700">
                <p>Location state: {location ? 'Ada data' : 'Kosong'}</p>
                <p>Current address: {currentAddress ? 'Ada alamat' : 'Kosong'}</p>
                <p>Loading address: {loadingAddress ? 'Ya' : 'Tidak'}</p>
                <p>Location loading: {locationLoading ? 'Ya' : 'Tidak'}</p>
                <p>Attendance location: {attendanceData.location ? 'Ada data' : 'Kosong'}</p>
              </div>
            </div>
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