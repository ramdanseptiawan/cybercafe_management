import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Camera, CheckCircle, AlertCircle, Upload, RotateCcw, X } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useCamera } from '../../hooks/useCamera';

const IndividualCheckIn = ({ currentUser, todayAttendance, onSubmit }) => {
  const [step, setStep] = useState('ready'); // ready -> camera -> confirm
  const [attendanceData, setAttendanceData] = useState({
    photo: null,
    location: null,
    timestamp: null
  });
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [captureTime, setCaptureTime] = useState('');
  const [captureLocation, setCaptureLocation] = useState(null);
  const [captureAddress, setCaptureAddress] = useState('');
  const [captureAccuracy, setCaptureAccuracy] = useState(null);
  const [locationValidation, setLocationValidation] = useState(null);
  const [captureDistance, setCaptureDistance] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { getCurrentLocation, validateMultipleLocations } = useGeolocation();
  const {
    videoRef,
    canvasRef,
    capturedPhoto,
    isStreaming,
    error: cameraError,
    devices,
    uploading,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retakePhoto
  } = useCamera();

  useEffect(() => {
    if (capturedPhoto) {
      setShowPreview(true);
    }
  }, [capturedPhoto]);

  // Lokasi yang diizinkan (sama seperti di CameraCapture)
  const allowedLocations = [
    {
      name: 'Main Office',
      latitude: -6.3353889,
      longitude: 106.4733848,
      radius: 100
    },
    {
      name: 'Branch Office',
      latitude: -6.2000,
      longitude: 106.8400,
      radius: 100
    }
  ];

  // Format timestamp dengan format: hari:bulan:tahun Jam:Menit:detik
  const formatTimestamp = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}:${month}:${year} ${hours}:${minutes}:${seconds}`;
  };

  const handleStartAttendance = async () => {
    setLoading(true);
    setError(null);
    setStep('camera');
    setShowCamera(true);
    
    try {
      await startCamera();
    } catch (error) {
      setError('Gagal mengakses kamera. Pastikan kamera tersedia.');
      setShowCamera(false);
      setStep('ready');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    setIsGettingLocation(true);
    let validation = null; // Deklarasi di awal fungsi
    
    try {
      const currentLocationData = await getCurrentLocation();
      
      // Validasi lokasi untuk mendapatkan jarak
      validation = validateMultipleLocations(allowedLocations);
      setLocationValidation(validation);
      
      // Store capture data dengan informasi jarak dari validasi
      setCaptureTime(formatTimestamp());
      
      if (currentLocationData) {
        setCaptureLocation({
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude
        });
        setCaptureAddress(currentLocationData.address || 'Lokasi tidak tersedia');
        setCaptureAccuracy(currentLocationData.accuracy);
        
        // Ambil jarak dari hasil validasi
        if (validation && validation.distance !== undefined) {
          setCaptureDistance(Math.round(validation.distance * 10) / 10); // Bulatkan ke 1 desimal
        } else {
          setCaptureDistance(null);
        }
      } else {
        setCaptureLocation(null);
        setCaptureAddress('Lokasi tidak tersedia');
        setCaptureAccuracy(null);
        setCaptureDistance(null);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCaptureLocation(null);
      setCaptureAddress('Lokasi tidak tersedia');
      setCaptureAccuracy(null);
      setCaptureDistance(null);
      // Reset validation jika terjadi error
      validation = null;
      setLocationValidation(null);
    }
    setIsGettingLocation(false);
  
    // Then capture photo
    const photoData = capturePhoto();
    if (photoData) {
      setAttendanceData(prev => ({
        ...prev,
        photo: photoData,
        location: {
          name: validation?.nearestLocation?.name || 'Main Office',
          latitude: captureLocation?.latitude,
          longitude: captureLocation?.longitude,
          distance: captureDistance,
          isValid: validation?.isValid || false
        },
        timestamp: new Date().toISOString()
      }));
    }
  };

  const handleUpload = async () => {
    if (!capturedPhoto) return;

    try {
      setUploadStatus('Mengunggah...');
      
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onSubmit(attendanceData);
      setUploadStatus('Berhasil diunggah!');
      
      // Auto close after success
      setTimeout(() => {
        handleCancel();
      }, 2000);
    } catch (error) {
      setUploadStatus('Gagal mengunggah. Coba lagi.');
    }
  };

  const handleCancel = () => {
    stopCamera();
    retakePhoto();
    setShowPreview(false);
    setShowCamera(false);
    setUploadStatus('');
    setCaptureTime('');
    setCaptureLocation(null);
    setCaptureAddress('');
    setCaptureAccuracy(null);
    setIsGettingLocation(false);
    setStep('ready');
    setAttendanceData({ photo: null, location: null, timestamp: null });
  };

  const handleRetake = async () => {
    // Reset all capture data
    retakePhoto();
    setShowPreview(false);
    setUploadStatus('');
    setCaptureTime('');
    setCaptureLocation(null);
    setCaptureAddress('');
    setCaptureAccuracy(null);
    setIsGettingLocation(false);
    
    // Immediately restart camera
    try {
      await startCamera();
    } catch (error) {
      console.error('Error restarting camera:', error);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Preview dengan styling yang sama persis dengan CameraCapture.js
  if (showPreview && capturedPhoto) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Preview Foto Absensi</h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full rounded-lg"
            />
            
            {/* Geotagging Overlay - sama persis dengan CameraCapture.js */}
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
              <div className="flex items-center space-x-1 mb-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{captureAddress}</span>
              </div>
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="w-3 h-3" />
                <span>{captureTime}</span>
              </div>
              {captureLocation && (
                <div className="text-xs opacity-75">
                  {captureLocation.latitude.toFixed(6)}, {captureLocation.longitude.toFixed(6)}
                  {captureDistance !== null && ` (${captureDistance}m dari kantor)`}
                </div>
              )}
            </div>
          </div>

          {uploadStatus && (
            <div className={`mb-4 p-3 rounded-lg text-center ${
              uploadStatus.includes('Berhasil') 
                ? 'bg-green-100 text-green-800' 
                : uploadStatus.includes('Gagal')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {uploadStatus.includes('Berhasil') && <CheckCircle className="w-5 h-5 inline mr-2" />}
              {uploadStatus}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
              disabled={uploading}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ambil Ulang</span>
            </button>
            
            <button
              onClick={handleUpload}
              disabled={uploading || uploadStatus.includes('Berhasil')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Mengunggah...' : 'Upload'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera View - sama persis dengan CameraCapture.js
  if (showCamera) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Camera View */}
        <div className="relative bg-black aspect-video">
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-10">
              <div className="text-center text-white p-6">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
            style={{
              minHeight: window.innerWidth <= 768 ? '400px' : '300px'
            }}
          />
          
          {/* Overlay Controls - sama persis dengan CameraCapture.js */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex space-x-2">
              {isStreaming && (
                <div className="flex items-center space-x-1 bg-green-600 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs">LIVE</span>
                </div>
              )}
              {isGettingLocation && (
                <div className="flex items-center space-x-1 bg-blue-600 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs">GPS</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleCancel}
                className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Controls - sama persis dengan CameraCapture.js */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
                >
                  <Camera className="w-5 h-5" />
                  <span>Mulai Kamera</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCapture}
                    disabled={isGettingLocation}
                    className="w-16 h-16 bg-white hover:bg-gray-100 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </button>
                  
                  <button
                    onClick={stopCamera}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                  >
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Ready State - tampilan awal sebelum kamera
  return (
    <div className="space-y-6">
      {/* Check In Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check In</h2>
        <p className="text-gray-600">Welcome, {currentUser?.name || 'John Doe'}</p>
        <p className="text-sm text-gray-500">{new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</p>
      </div>

      {/* Verify Location Section */}
      <div className="text-center">
        <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
          <MapPin className="text-blue-600 w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Location</h3>
        <p className="text-gray-600 text-sm mb-4">
          We need to verify your location for attendance
        </p>
        
        {/* Authorized Locations */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Authorized Locations:</p>
          <div className="space-y-1">
            {allowedLocations.map((loc, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {loc.name} (±{loc.radius || 100}m radius)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Attendance Status */}
      {todayAttendance ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Absensi Hari Ini</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Check-in:</span>
              <div className="font-medium">{todayAttendance.checkIn || '--'}</div>
            </div>
            <div>
              <span className="text-gray-600">Check-out:</span>
              <div className="font-medium">{todayAttendance.checkOut || '--'}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Total Jam:</span>
              <div className="font-medium">{todayAttendance.hours || '--'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Belum ada absensi hari ini</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Capture Location Button */}
      <div className="text-center">
        <button
          onClick={handleStartAttendance}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
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
    </div>
  );
};

export default IndividualCheckIn;