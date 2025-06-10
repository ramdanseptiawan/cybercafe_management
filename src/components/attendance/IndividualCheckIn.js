import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, AlertTriangle, CheckCircle, Loader, RotateCcw, X } from 'lucide-react';
import { locationService } from '../../services/locationService';
import { attendanceService } from '../../services/attendanceService';

const IndividualCheckIn = ({ currentUser, todayAttendance, onSubmit }) => {
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [nearestLocation, setNearestLocation] = useState(null);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [photoTimestamp, setPhotoTimestamp] = useState(null);
  const [photoLocation, setPhotoLocation] = useState(null);
  
  // State untuk fitur address
  const [currentAddress, setCurrentAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const maxDistance = 100; // Maximum distance in meters

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
        throw new Error('Gagal mengambil data alamat');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
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
      
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Alamat tidak dapat diambil';
    } finally {
      setLoadingAddress(false);
    }
  };

  // Fetch available locations from backend
  const fetchAvailableLocations = async () => {
    try {
      console.log('[INDIVIDUAL CHECK-IN] Fetching available locations from backend...');
      const response = await locationService.getAllLocations();
      console.log('[INDIVIDUAL CHECK-IN] Available locations:', response.data);
      setAvailableLocations(response.data || []);
    } catch (error) {
      console.error('[INDIVIDUAL CHECK-IN] Error fetching locations:', error);
      setError('Gagal mengambil data lokasi dari server');
    }
  };

  useEffect(() => {
    // Get available locations from backend
    fetchAvailableLocations();
    // Get user location on component mount
    getLocation();
    getVideoDevices();

    // Setup digital clock
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup on unmount
    return () => {
      stopCamera();
      clearInterval(timer);
    };
  }, [todayAttendance]);

  // Format time for digital clock
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) return; // Don't start if already running
      
      setError(null);
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera for selfie
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const switchCamera = async () => {
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    if (nextDevice) {
      setSelectedDevice(nextDevice.deviceId);
      if (cameraActive) {
        stopCamera();
        setTimeout(() => {
          startCamera();
        }, 100);
      }
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Gunakan resolusi asli video
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      
      console.log('Capturing photo with dimensions:', videoWidth, 'x', videoHeight);
      
      // Set canvas size
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Enable high quality rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // Convert to blob with high quality
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 1024) {
              console.log('Photo blob created:', {
                size: blob.size,
                type: blob.type,
                sizeKB: Math.round(blob.size / 1024)
              });
              
              const url = URL.createObjectURL(blob);
              resolve({ blob, url });
            } else {
              reject(new Error('Invalid photo blob created'));
            }
          },
          'image/jpeg',
          0.95 // High quality
        );
      });
      
    } catch (error) {
      console.error('Error in capturePhoto:', error);
      throw error;
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPhotoTimestamp(null);
    setPhotoLocation(null);
    setError(null);
  };

  const formatPhotoTime = (date) => {
    if (!date) return '';
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return date.toLocaleString('id-ID', options);
  };

  const openCamera = () => {
    setShowCameraModal(true);
    setTimeout(() => startCamera(), 100);
  };

  const closeCameraModal = () => {
    stopCamera();
    setShowCameraModal(false);
  };

  const handleSubmit = async () => {
    // Check if already checked out
    if (todayAttendance && todayAttendance.checked_out) {
      setError('Anda sudah melakukan absen keluar hari ini');
      return;
    }

    if (!location) {
      setError('Lokasi belum terdeteksi. Silakan tunggu atau refresh halaman.');
      return;
    }

    if (!nearestLocation) {
      setError('Tidak dapat menemukan lokasi absensi terdekat.');
      return;
    }

    // Check distance validation
    if (calculatedDistance > maxDistance) {
      setError(`Anda berada di luar jangkauan lokasi absensi (${calculatedDistance.toFixed(0)}m dari ${nearestLocation.name}). Maksimal jarak ${maxDistance}m.`);
      return;
    }

    if (!photo) {
      setError('Foto absensi belum diambil');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Submit attendance with user location and nearest location info
      await onSubmit({
        photo: photo,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: currentAddress || location.address || 'Alamat tidak tersedia',
          nearest_location_id: nearestLocation.id,
          nearest_location_name: nearestLocation.name,
          distance: calculatedDistance
        }
      });
    } catch (err) {
      setError(err.message || 'Gagal mengirim data absensi');
    } finally {
      setLoading(false);
    }
  };

  // Find nearest location from available locations
  const findNearestLocation = (userLat, userLng, locations) => {
    if (!locations || locations.length === 0) {
      console.log('[INDIVIDUAL CHECK-IN] No locations available for distance calculation');
      return null;
    }

    let minDistance = Infinity;
    let nearest = null;

    locations.forEach(location => {
      const distance = calculateDistance(
        userLat, userLng,
        location.latitude, location.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          ...location,
          distance: distance
        };
      }
    });

    return nearest;
  };

  // Get user's current location
  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('[INDIVIDUAL CHECK-IN] User coordinates:', {
            latitude,
            longitude,
            accuracy
          });

          // Set location accuracy
          setLocationAccuracy(accuracy);

          // Dapatkan address dari koordinat
          const address = await getAddressFromCoordinates(latitude, longitude);
          setCurrentAddress(address);

          // Set user location
          const userLocation = {
            latitude,
            longitude,
            address: address,
            accuracy: accuracy
          };
          setLocation(userLocation);

          // Calculate distance to nearest location if available locations exist
          if (availableLocations.length > 0) {
            const nearest = findNearestLocation(latitude, longitude, availableLocations);
            console.log('[INDIVIDUAL CHECK-IN] Nearest location:', nearest);
            if (nearest) {
              setNearestLocation(nearest);
              setCalculatedDistance(nearest.distance);
            }
          }
        },
        (error) => {
          console.error('[INDIVIDUAL CHECK-IN] Geolocation error:', error);
          setError({
            1: 'Akses lokasi ditolak. Silakan izinkan akses lokasi.',
            2: 'Lokasi tidak tersedia.',
            3: 'Timeout saat mengambil lokasi.'
          }[error.code] || 'Gagal mendapatkan lokasi');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser ini');
    }
  };

  // Recalculate distance when availableLocations or location changes
  useEffect(() => {
    if (availableLocations.length > 0 && location) {
      const nearest = findNearestLocation(
        location.latitude, 
        location.longitude, 
        availableLocations
      );
      if (nearest) {
        setNearestLocation(nearest);
        setCalculatedDistance(nearest.distance);
      }
    }
  }, [availableLocations, location]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Absensi Individual</h2>
          <div className="text-lg font-mono">{formatTime(currentTime)}</div>
          <div className="text-sm opacity-90">{formatDate(currentTime)}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Absensi Hari Ini */}
        {todayAttendance && todayAttendance.checkOut !== '--' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="font-medium text-green-800">Absensi Hari Ini</span>
            </div>
            <div className="text-sm text-green-700">
              <p>Masuk: {todayAttendance.checkIn}</p>
              <p>Keluar: {todayAttendance.checkOut}</p>
            </div>
          </div>
        )}

        {/* Status Absensi */}
        {todayAttendance && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-blue-600" size={20} />
              <span className="font-medium text-blue-800">Status Absensi</span>
            </div>
            <div className="text-sm text-blue-700">
              {todayAttendance.checked_in && !todayAttendance.checked_out ? (
                <p>Sudah absen masuk: {todayAttendance.check_in_time}</p>
              ) : todayAttendance.checked_out ? (
                <p>Absensi hari ini sudah lengkap</p>
              ) : (
                <p>Belum absen masuk hari ini</p>
              )}
            </div>
          </div>
        )}

        {/* Informasi Lokasi Saat Ini - Card Baru */}
        {(location || currentAddress || loadingAddress) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="text-purple-600" size={20} />
              <span className="font-medium text-purple-800">📍 Lokasi Saat Ini</span>
            </div>
            
            <div className="space-y-2 text-sm">
              {/* Koordinat GPS */}
              {location && (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="font-medium text-gray-800 mb-1">🌐 Koordinat GPS:</div>
                  <div className="text-gray-600 space-y-1">
                    <p>• Latitude: <span className="font-mono">{location.latitude.toFixed(6)}</span></p>
                    <p>• Longitude: <span className="font-mono">{location.longitude.toFixed(6)}</span></p>
                    {locationAccuracy && (
                      <p>• Akurasi: <span className="font-medium">{Math.round(locationAccuracy)}m</span></p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Alamat Lengkap */}
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="font-medium text-gray-800 mb-1">🏠 Alamat:</div>
                {loadingAddress ? (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Loader className="animate-spin" size={14} />
                    <span>Mengambil alamat...</span>
                  </div>
                ) : (
                  <p className="text-gray-600">{currentAddress || 'Alamat belum tersedia'}</p>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="text-xs text-purple-600 text-center pt-1">
                ⏰ Diperbarui: {new Date().toLocaleTimeString('id-ID')}
              </div>
            </div>
          </div>
        )}

        {/* Location Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-gray-600" size={20} />
            <span className="font-medium text-gray-800">Status Lokasi</span>
          </div>
          
          {nearestLocation && calculatedDistance !== null ? (
            <div className="text-sm text-gray-700 space-y-2">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p><span className="font-medium">Lokasi terdekat:</span> {nearestLocation.name}</p>
                {/* Tambahan alamat lokasi */}
                {nearestLocation.address && (
                  <p><span className="font-medium">Alamat:</span> {nearestLocation.address}</p>
                )}
                <p><span className="font-medium">Jarak:</span> {calculatedDistance.toFixed(0)} meter</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`font-medium ml-1 ${
                    calculatedDistance <= maxDistance ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculatedDistance <= maxDistance ? '✅ Dalam jangkauan' : '❌ Di luar jangkauan'}
                  </span>
                </p>
              </div>
              <div className="flex justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  calculatedDistance <= maxDistance 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {calculatedDistance <= maxDistance 
                    ? `✓ Dalam radius ${maxDistance}m` 
                    : `✗ Melebihi radius ${maxDistance}m`
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader className="animate-spin" size={14} />
              <span>Menghitung lokasi...</span>
            </div>
          )}
        </div>

        {/* Photo Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="text-gray-600" size={20} />
            <span className="font-medium text-gray-800">Foto Absensi</span>
          </div>
          
          {photo ? (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={photo.url} 
                  alt="Foto Absensi" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              {photoTimestamp && photoLocation && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p>📅 {formatPhotoTime(photoTimestamp)}</p>
                  <p>📍 {currentAddress || photoLocation.address || 'Alamat tidak tersedia'}</p>
                  {photoLocation.latitude && photoLocation.longitude && (
                    <p>🌐 {photoLocation.latitude.toFixed(6)}, {photoLocation.longitude.toFixed(6)}</p>
                  )}
                </div>
              )}
              
              <button
                onClick={retakePhoto}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Ambil Ulang
              </button>
            </div>
          ) : (
            <button
              onClick={openCamera}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Ambil Foto
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            loading || 
            !location || 
            !nearestLocation ||
            calculatedDistance > maxDistance ||
            !photo ||
            (todayAttendance && todayAttendance.checked_out)
          }
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            loading || 
            !location || 
            !nearestLocation ||
            calculatedDistance > maxDistance ||
            !photo ||
            (todayAttendance && todayAttendance.checked_out)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Memproses...
            </>
          ) : todayAttendance && todayAttendance.checked_out ? (
            'Absensi Sudah Lengkap'
          ) : (
            <>
              <Camera size={20} />
              {todayAttendance && todayAttendance.checked_in ? 'Absen Keluar' : 'Absen Masuk'}
            </>
          )}
        </button>

        {/* Camera Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg p-6 w-full mx-4 ${
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
                ? 'max-w-sm max-h-[90vh] overflow-y-auto' // Mobile: lebih sempit dan tinggi
                : 'max-w-md' // Desktop: ukuran normal
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ambil Foto Absensi</h3>
                <button onClick={closeCameraModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className={`relative bg-black rounded-lg overflow-hidden mb-4 ${
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
                  ? 'aspect-[3/4]' // Mobile: Portrait aspect ratio
                  : 'aspect-video' // Desktop: Landscape aspect ratio
              }`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              
              {devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="w-full mb-3 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Ganti Kamera
                </button>
              )}
              
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  Mulai Kamera
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const photoData = await capturePhoto();
                    if (photoData) {
                      setPhoto(photoData);
                      setPhotoTimestamp(new Date());
                      setPhotoLocation(location);
                      closeCameraModal();
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  Ambil Foto
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default IndividualCheckIn;
