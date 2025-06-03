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

  const capturePhoto = useCallback((overlayData = {}) => {
    if (!videoRef.current || !canvasRef.current) return null;
  
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    // Mirror the image for selfie effect
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);
    
    // Reset scale for overlay text
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Add overlay with location and time if provided
    if (overlayData.timestamp || overlayData.location || overlayData.address) {
      const overlayHeight = 80;
      const padding = 10;
      
      // Draw semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);
      
      // Set text style
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      
      let yPosition = canvas.height - overlayHeight + 20;
      
      // Draw timestamp
      if (overlayData.timestamp) {
        ctx.fillText(`⏰ ${overlayData.timestamp}`, padding, yPosition);
        yPosition += 20;
      }
      
      // Draw address
      if (overlayData.address) {
        const maxWidth = canvas.width - (padding * 2);
        const addressText = `📍 ${overlayData.address}`;
        
        // Truncate text if too long
        let displayText = addressText;
        if (ctx.measureText(addressText).width > maxWidth) {
          while (ctx.measureText(displayText + '...').width > maxWidth && displayText.length > 10) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }
        
        ctx.fillText(displayText, padding, yPosition);
        yPosition += 20;
      }
      
      // Draw coordinates and distance
      if (overlayData.location) {
        const coordText = `${overlayData.location.latitude.toFixed(6)}, ${overlayData.location.longitude.toFixed(6)}`;
        const distanceText = overlayData.distance !== null ? ` (${overlayData.distance}m dari kantor)` : '';
        
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(coordText + distanceText, padding, yPosition);
      }
    }
  
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