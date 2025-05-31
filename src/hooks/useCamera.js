import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [uploading, setUploading] = useState(false);

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
      setError('');
      await getVideoDevices();
      
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
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Tidak dapat mengakses kamera: ' + err.message);
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // Mirror the image for selfie effect
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);
    
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataURL);
    return dataURL;
  }, []);

  const uploadPhoto = async (photoData, metadata = {}) => {
    setUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('photo', blob, 'attendance-photo.jpg');
      formData.append('metadata', JSON.stringify(metadata));
      
      const uploadResponse = await fetch('/api/upload-attendance-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await uploadResponse.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    if (nextDevice) {
      setSelectedDevice(nextDevice.deviceId);
      if (isStreaming) {
        stopCamera();
        setTimeout(() => {
          setSelectedDevice(nextDevice.deviceId);
          startCamera();
        }, 100);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  return {
    videoRef,
    canvasRef,
    isStreaming,
    capturedPhoto,
    error,
    devices,
    selectedDevice,
    uploading,
    startCamera,
    stopCamera,
    capturePhoto,
    uploadPhoto,
    switchCamera,
    retakePhoto,
    setCapturedPhoto
  };
};