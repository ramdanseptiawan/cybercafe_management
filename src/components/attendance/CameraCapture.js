"use client";
import React, { useState, useEffect } from 'react';
import { Camera, Upload, RotateCcw, X, MapPin, Clock, CheckCircle } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useGeolocation } from '../../hooks/useGeolocation';

const CameraCapture = ({ onPhotoCapture, onClose, onCancel }) => {
  const {
    videoRef,
    canvasRef,
    capturedPhoto,
    isStreaming,
    error,
    devices,
    uploading,
    startCamera,
    stopCamera,
    capturePhoto,
    uploadPhoto,
    switchCamera,
    retakePhoto
  } = useCamera();

  const { getCurrentLocation, validateMultipleLocations } = useGeolocation();
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [captureTime, setCaptureTime] = useState('');
  const [captureLocation, setCaptureLocation] = useState(null);
  const [captureAddress, setCaptureAddress] = useState('');
  const [captureAccuracy, setCaptureAccuracy] = useState(null);
  const [locationValidation, setLocationValidation] = useState(null);
  const [captureDistance, setCaptureDistance] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (capturedPhoto) {
      setShowPreview(true);
    }
  }, [capturedPhoto]);

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

  // Lokasi yang diizinkan (sama seperti di AttendanceCheckIn)
  const allowedLocations = [
    {
      name: 'Main Office',
      latitude: -6.3353889,
      longitude: 106.4733848,
      radius: 100
    },
    {
      name: 'Branch Office',
      latitude: -6.3353813,
      longitude: 106.4733707,
      radius: 100
    }
  ];

  const handleCapture = async () => {
    setIsGettingLocation(true);
    
    try {
      const currentLocationData = await getCurrentLocation();
      
      // Validasi lokasi untuk mendapatkan jarak
      const validation = validateMultipleLocations(allowedLocations);
      setLocationValidation(validation);
      
      // Store capture data dengan informasi jarak dari validasi
      const timestamp = formatTimestamp();
      setCaptureTime(timestamp);
      
      let locationData = null;
      let address = 'Lokasi tidak tersedia';
      let distance = null;
      
      if (currentLocationData) {
        locationData = {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude
        };
        setCaptureLocation(locationData);
        address = currentLocationData.address || 'Lokasi tidak tersedia';
        setCaptureAddress(address);
        
        // Ambil jarak dari hasil validasi
        if (validation && validation.distance !== undefined) {
          distance = Math.round(validation.distance * 10) / 10; // Bulatkan ke 1 desimal
          setCaptureDistance(distance);
        }
      } else {
        setCaptureLocation(null);
        setCaptureAddress(address);
        setCaptureDistance(null);
      }
      
      // Prepare overlay data
      const overlayData = {
        timestamp: timestamp,
        location: locationData,
        address: address,
        distance: distance
      };
      
      // Capture photo with overlay
      const photoData = capturePhoto(overlayData);
      if (photoData) {
        if (onPhotoCapture) {
          onPhotoCapture(photoData);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setCaptureLocation(null);
      setCaptureAddress('Lokasi tidak tersedia');
      setCaptureDistance(null);
      
      // Still capture photo even if location fails
      const photoData = capturePhoto({
        timestamp: formatTimestamp(),
        address: 'Lokasi tidak tersedia'
      });
      if (photoData) {
        if (onPhotoCapture) {
          onPhotoCapture(photoData);
        }
      }
    }
    setIsGettingLocation(false);
  };

  const handleUpload = async () => {
    if (!capturedPhoto) return;

    try {
      setUploadStatus('Mengunggah...');
      const metadata = {
        timestamp: new Date().toISOString(),
        location: captureLocation,
        address: captureAddress,
        accuracy: captureAccuracy
      };

      await uploadPhoto(capturedPhoto, metadata);
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
    setUploadStatus('');
    setCaptureTime('');
    setCaptureLocation(null);
    setCaptureAddress('');
    setCaptureAccuracy(null);
    setIsGettingLocation(false);
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
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
            
            {/* Geotagging Overlay */}
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Camera View */}
      <div className="relative bg-black aspect-video">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-10">
            <div className="text-center text-white p-6">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-4">{error}</p>
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
            minHeight: window.innerWidth <= 768 ? '400px' : '300px' // Minimum height lebih tinggi untuk mobile
          }}
        />
        
        {/* Overlay Controls */}
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

        {/* Bottom Controls */}
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
};

export default CameraCapture;