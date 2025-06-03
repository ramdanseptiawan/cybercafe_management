import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Clock, AlertTriangle, CheckCircle, Loader, RotateCcw, X } from 'lucide-react';

const IndividualCheckIn = ({ currentUser, todayAttendance, onSubmit }) => {
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [photoTimestamp, setPhotoTimestamp] = useState(null); // Tambahkan state untuk waktu foto
  const [photoLocation, setPhotoLocation] = useState(null); // Tambahkan state untuk lokasi foto
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Office location coordinates (example: Main Office in Jakarta)
  const officeLocations = [
    { 
      id: 1, 
      name: 'Main Office', 
      latitude: -6.2088, 
      longitude: 106.8456, 
      radius: 100 // meters
    },
    { 
      id: 2, 
      name: 'Branch Office', 
      latitude: -6.1751, 
      longitude: 106.8650, 
      radius: 100 // meters
    },
    { 
      id: 3, 
      name: 'Cabang Palmerah', 
      latitude: -6.2081704, 
      longitude: 106.7938223, 
      radius: 100 // meters
    }
  ];

  useEffect(() => {
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.');
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
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    if (nextDevice) {
      setSelectedDevice(nextDevice.deviceId);
      if (cameraActive) {
        stopCamera();
        setTimeout(() => {
          setSelectedDevice(nextDevice.deviceId);
          startCamera();
        }, 100);
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          
          // Find nearest office and calculate distance
          let nearestOffice = null;
          let minDistance = Infinity;
          
          officeLocations.forEach(office => {
            const dist = calculateDistance(
              userLat, userLng,
              office.latitude, office.longitude
            );
            
            if (dist < minDistance) {
              minDistance = dist;
              nearestOffice = { ...office, distance: dist };
            }
          });
          
          setLocation(nearestOffice);
          setDistance(minDistance);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Tidak dapat mendapatkan lokasi Anda. Pastikan GPS diaktifkan.');
        }
      );
    } else {
      setError('Geolocation tidak didukung oleh browser Anda.');
    }
  };

  // Haversine formula to calculate distance between two coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Distance in meters
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
  
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Detect if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
      // For mobile: use portrait orientation (higher than wide)
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      if (aspectRatio > 1) {
        // Video is landscape, make canvas portrait
        canvas.width = Math.min(video.videoHeight, 480); // Max width 480px
        canvas.height = canvas.width * 1.33; // 4:3 ratio but taller
      } else {
        // Video is already portrait
        canvas.width = Math.min(video.videoWidth, 480);
        canvas.height = Math.min(video.videoHeight, 640); // Max height 640px
      }
    } else {
      // For desktop: use original video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Calculate scaling and positioning for mobile
    if (isMobile) {
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;
      const scale = Math.max(scaleX, scaleY); // Use larger scale to fill canvas
      
      const scaledWidth = video.videoWidth * scale;
      const scaledHeight = video.videoHeight * scale;
      
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;
      
      // Mirror the image for selfie effect
      ctx.scale(-1, 1);
      ctx.drawImage(
        video, 
        -offsetX - scaledWidth, 
        offsetY, 
        scaledWidth, 
        scaledHeight
      );
    } else {
      // Desktop: use original method
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0);
    }
    
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(photoData);
    
    // Simpan waktu dan lokasi saat foto diambil
    setPhotoTimestamp(new Date());
    setPhotoLocation(location);
    
    setShowCameraModal(false);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPhotoTimestamp(null); // Reset waktu foto
    setPhotoLocation(null); // Reset lokasi foto
    openCamera();
  };

  // Format waktu untuk tampilan
  const formatPhotoTime = (date) => {
    if (!date) return '';
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const openCamera = () => {
    setShowCameraModal(true);
    startCamera();
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    stopCamera();
  };


  const handleSubmit = async () => {
    // Cek jika sudah absen lengkap
    if (todayAttendance && todayAttendance.checkOut !== '--') {
      alert('Anda sudah menyelesaikan absensi untuk hari ini (masuk dan keluar).');
      return;
    }
  
    if (!location) {
      setError('Lokasi belum terdeteksi. Pastikan GPS aktif.');
      return;
    }
  
    if (location.distance > location.radius) {
      setError(`Anda berada ${location.distance}m dari ${location.name}. Jarak maksimal ${location.radius}m.`);
      return;
    }
  
    if (!photo) {
      setError('Foto wajib diambil untuk absensi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Verify location is within allowed radius
      if (!location) {
        throw new Error('Lokasi tidak tersedia. Pastikan GPS diaktifkan.');
      }
      
      if (location.distance > location.radius) {
        throw new Error(`Anda terlalu jauh dari ${location.name}. Jarak Anda saat ini: ${location.distance}m (maksimal ${location.radius}m).`);
      }
      
      // Verify photo is taken for BOTH check-in and check-out
      if (!photo) {
        const actionType = todayAttendance && todayAttendance.checkOut === '--' ? 'keluar' : 'masuk';
        throw new Error(`Silakan ambil foto untuk absen ${actionType}.`);
      }
      
      // Submit attendance data
      await onSubmit({
        photo,
        location
      });
      
      // Reset state after successful submission
      setPhoto(null);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Clock Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="text-white" size={24} />
          <h3 className="text-lg font-semibold">Waktu Saat Ini</h3>
        </div>
        <div className="text-4xl font-mono font-bold mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm opacity-90">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Attendance Status - Tambahkan notifikasi jika sudah absen lengkap */}
      {todayAttendance && todayAttendance.checkOut !== '--' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <h4 className="font-medium text-green-800">Absensi Hari Ini Sudah Lengkap</h4>
              <p className="text-sm text-green-600">
                Masuk: {todayAttendance.checkIn} | Keluar: {todayAttendance.checkOut}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing attendance status display */}
      {todayAttendance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-blue-600" size={20} />
            <h4 className="font-medium text-blue-800">Status Absensi Hari Ini</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Jam Masuk:</span>
              <p className="font-medium text-blue-800">{todayAttendance.checkIn}</p>
            </div>
            <div>
              <span className="text-gray-600">Jam Keluar:</span>
              <p className="font-medium text-blue-800">{todayAttendance.checkOut}</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="text-blue-500" size={20} />
          <h4 className="font-medium text-gray-800">Status Lokasi</h4>
        </div>
        
        {location ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lokasi terdekat:</span>
              <span className="font-medium">{location.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Jarak:</span>
              <span className={`font-medium ${
                location.distance <= location.radius ? 'text-green-600' : 'text-red-600'
              }`}>
                {location.distance}m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                location.distance <= location.radius 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {location.distance <= location.radius ? 'Dalam jangkauan' : 'Terlalu jauh'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin text-blue-500" size={16} />
            <span className="text-sm text-gray-600">Mendapatkan lokasi...</span>
          </div>
        )}
      </div>

      {/* Photo Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Camera className="text-purple-500" size={20} />
          <h4 className="font-medium text-gray-800">Foto Absensi</h4>
        </div>
        
        {photo ? (
          <div className="space-y-3">
            <img 
              src={photo} 
              alt="Foto absensi" 
              className="w-full max-w-xs mx-auto rounded-lg border-2 border-gray-200"
            />
            
            {/* Informasi Lokasi dan Waktu Foto */}
            {photoTimestamp && photoLocation && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="text-blue-500" size={16} />
                    <span className="font-medium text-gray-700">Waktu Pengambilan:</span>
                  </div>
                  <p className="text-gray-600 ml-6">{formatPhotoTime(photoTimestamp)}</p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <MapPin className="text-green-500" size={16} />
                    <span className="font-medium text-gray-700">Lokasi:</span>
                  </div>
                  <div className="ml-6 text-gray-600">
                    <p className="font-medium">{photoLocation.name}</p>
                    <p className="text-xs">Jarak: {photoLocation.distance}m dari kantor</p>
                    {photoLocation.address && (
                      <p className="text-xs mt-1">{photoLocation.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={retakePhoto}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Ambil Ulang Foto
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

      {/* Submit Button - Modifikasi untuk disable jika sudah absen lengkap */}
      <button
        onClick={handleSubmit}
        disabled={
          loading || 
          !location || 
          (location.distance > location.radius) || 
          !photo ||
          (todayAttendance && todayAttendance.checkOut !== '--') // Disable jika sudah absen lengkap
        }
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          loading || 
          !location || 
          (location.distance > location.radius) || 
          !photo ||
          (todayAttendance && todayAttendance.checkOut !== '--')
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : todayAttendance && todayAttendance.checkOut === '--'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            Memproses...
          </>
        ) : todayAttendance && todayAttendance.checkOut !== '--' ? (
          <>
            <CheckCircle size={20} />
            Absensi Sudah Lengkap
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            {todayAttendance && todayAttendance.checkOut === '--' ? 'Absen Keluar' : 'Absen Masuk'}
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
              <button
                onClick={closeCameraModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className={`relative bg-black rounded-lg overflow-hidden mb-4 ${
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
                ? 'aspect-[3/4]' // Mobile: rasio 3:4 (lebih tinggi)
                : 'aspect-video' // Desktop: rasio 16:9
            }`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera controls overlay */}
              <div className="absolute top-4 right-4">
                {devices.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeCameraModal}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                Ambil Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default IndividualCheckIn;