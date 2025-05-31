"use client";
import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoCaptureTimerRef = useRef(null);

  const startCamera = useCallback(async (autoCapture = false) => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera for selfie
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        
        // Auto capture after 3 seconds if enabled
        if (autoCapture) {
          setAutoCapturing(true);
          autoCaptureTimerRef.current = setTimeout(() => {
            capturePhoto();
            setAutoCapturing(false);
          }, 3000);
        }
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      // Clear auto capture timer
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      setAutoCapturing(false);
      
      return imageData;
    }
    return null;
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    setIsCapturing(false);
    setAutoCapturing(false);
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    setAutoCapturing(false);
  }, []);

  const uploadPhoto = useCallback(async (photoData, metadata = {}) => {
    try {
      // Convert base64 to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('photo', blob, `attendance-${Date.now()}.jpg`);
      formData.append('metadata', JSON.stringify(metadata));
      
      // Simulate upload (replace with your actual upload endpoint)
      const uploadResponse = await fetch('/api/upload-attendance-photo', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await uploadResponse.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, []);

  return {
    isCapturing,
    capturedImage,
    error,
    autoCapturing,
    videoRef,
    canvasRef,
    startCamera,
    capturePhoto,
    stopCamera,
    resetCapture,
    uploadPhoto
  };
};