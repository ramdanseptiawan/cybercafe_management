"use client";
import React, { useState, useEffect } from 'react';
import { Camera, RotateCcw, Check, X, MapPin, Upload, Clock, User } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useGeolocation } from '../../hooks/useGeolocation';

const CameraCapture = ({ onCapture, onCancel, autoCapture = false }) => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const {
    isCapturing,
    capturedImage,
    error,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    stopCamera,
    resetCapture,
    uploadPhoto
  } = useCamera();

  const { location, getCurrentLocation } = useGeolocation();

  const handleStartCamera = async () => {
    try {
      setCameraReady(false);
      // Get location first
      await getCurrentLocation();
      // Start camera
      await startCamera(false); // Disable auto capture, use manual
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  // Handle video ready event
  const handleVideoReady = () => {
    setCameraReady(true);
  };

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      setShowPreview(true);
    }
  };

  const handleConfirm = () => {
    if (capturedImage && onCapture) {
      onCapture({
        photo: capturedImage,
        location: location,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    
    setUploadStatus('uploading');
    try {
      const metadata = {
        location: location,
        timestamp: new Date().toISOString(),
        type: 'attendance'
      };
      
      await uploadPhoto(capturedImage, metadata);
      setUploadStatus('success');
      
      // Auto proceed after successful upload
      setTimeout(() => {
        handleConfirm();
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      console.error('Upload failed:', error);
    }
  };

  const handleRetake = () => {
    resetCapture();
    setUploadStatus(null);
    setShowPreview(false);
    setCameraReady(false);
    startCamera(false);
  };

  const handleCancel = () => {
    stopCamera();
    setCameraReady(false);
    if (onCancel) onCancel();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <X className="text-red-600 w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Camera Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Take Attendance Photo</h3>
        <p className="text-gray-600 text-sm">Position your face within the frame</p>
      </div>

      <div className="relative mb-4">
        {/* Initial State - Start Camera */}
        {!isCapturing && !capturedImage && (
          <div className="bg-gray-100 rounded-lg p-8 text-center aspect-square flex flex-col items-center justify-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <Camera className="text-blue-600 w-12 h-12" />
            </div>
            <h4 className="font-medium text-gray-800 mb-2">Ready to Take Photo</h4>
            <p className="text-sm text-gray-600 mb-4">Click start to begin camera</p>
            <button
              onClick={handleStartCamera}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
          </div>
        )}

        {/* Camera Loading State */}
        {isCapturing && !cameraReady && !capturedImage && (
          <div className="bg-gray-100 rounded-lg p-8 text-center aspect-square flex flex-col items-center justify-center">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
            <h4 className="font-medium text-gray-800 mb-2">Starting Camera...</h4>
            <p className="text-sm text-gray-600">Please wait while we access your camera</p>
          </div>
        )}

        {/* Camera View */}
        {isCapturing && cameraReady && !capturedImage && (
          <div className="relative aspect-square">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={handleVideoReady}
              className="w-full h-full object-cover rounded-lg"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie
            />
            
            {/* Camera Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Outer overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg"></div>
              
              {/* Face guide circle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border-4 border-white rounded-full bg-transparent relative">
                  {/* Corner guides */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
                  
                  {/* Center icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <User className="w-8 h-8 text-white opacity-50" />
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                Position your face in the circle
              </div>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {capturedImage && showPreview && (
          <div className="relative aspect-square">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover rounded-lg"
            />
            
            {/* Geotagging Overlay */}
            {location && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4 rounded-b-lg">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium truncate">{location.address}</div>
                    <div className="opacity-75 text-xs">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-75 text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                    <div className="opacity-75 text-xs">
                      Accuracy: ±{Math.round(location.accuracy || 0)}m
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Upload Status Overlay */}
            {uploadStatus && (
              <div className="absolute top-2 right-2">
                {uploadStatus === 'uploading' && (
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Uploaded!
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Upload Failed
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Camera Controls */}
        {isCapturing && cameraReady && !capturedImage && (
          <div className="flex gap-3">
            <button
              onClick={handleCapture}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Camera size={20} />
              Take Photo
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Preview Controls */}
        {capturedImage && showPreview && (
          <>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading'}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Upload size={16} />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Check size={16} />
                Confirm
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetake}
                className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;