"use client";
import React from 'react';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

const CameraCapture = ({ onCapture, onCancel }) => {
  const {
    isCapturing,
    capturedImage,
    error,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    stopCamera,
    resetCapture
  } = useCamera();

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData && onCapture) {
      onCapture(imageData);
    }
  };

  const handleRetake = () => {
    resetCapture();
    startCamera();
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) onCancel();
  };

  React.useEffect(() => {
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
        <p className="text-gray-600 text-sm">Position your face in the center</p>
      </div>

      <div className="relative mb-4">
        {!isCapturing && !capturedImage && (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Camera className="text-gray-400 w-16 h-16 mx-auto mb-4" />
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Camera
            </button>
          </div>
        )}

        {isCapturing && !capturedImage && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-full opacity-50"></div>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3">
        {isCapturing && !capturedImage && (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Capture
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Confirm
            </button>
            <button
              onClick={handleRetake}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Retake
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;