"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, RotateCcw, Settings, Maximize } from 'lucide-react';

export default function CameraApp() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    getVideoDevices();
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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

  const startStream = async () => {
    try {
      setError('');
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (err) {
      setError('Tidak dapat mengakses kamera: ' + err.message);
      console.error('Error accessing camera:', err);
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // ✅ PERBAIKAN: Gunakan resolusi yang lebih tinggi
    const scale = 2; // Tingkatkan resolusi 2x
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    // ✅ PERBAIKAN: Aktifkan image smoothing untuk kualitas lebih baik
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Scale context untuk resolusi tinggi
    ctx.scale(scale, scale);
    ctx.drawImage(video, 0, 0);
    
    // ✅ PERBAIKAN: Tingkatkan kualitas JPEG dari 0.8 ke 0.95
    const dataURL = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(dataURL);
  };

  const downloadPhoto = () => {
    if (!capturedPhoto) return;
    
    const link = document.createElement('a');
    link.download = `foto-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
    link.href = capturedPhoto;
    link.click();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const switchCamera = async () => {
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    if (nextDevice) {
      setSelectedDevice(nextDevice.deviceId);
      if (isStreaming) {
        stopStream();
        setTimeout(() => {
          setSelectedDevice(nextDevice.deviceId);
          startStream();
        }, 100);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Web Kamera</h1>
              <p className="text-purple-300">Ambil foto dengan mudah</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isRecording && (
              <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Camera View */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 z-10">
              <div className="text-center text-white p-6">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-4">{error}</p>
                <button
                  onClick={startStream}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          <div className="relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
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
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-colors"
                >
                  <Maximize className="w-4 h-4" />
                </button>
                <button
                  onClick={switchCamera}
                  className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg text-white transition-colors"
                  disabled={devices.length <= 1}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-4">
                {!isStreaming ? (
                  <button
                    onClick={startStream}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Mulai Kamera</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={capturePhoto}
                      className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
                    >
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </button>
                    
                    <button
                      onClick={stopStream}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Camera Settings */}
        {devices.length > 1 && (
          <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-purple-300" />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-transparent text-white border border-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId} className="text-black">
                    {device.label || `Kamera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Captured Photo Preview */}
        {capturedPhoto && (
          <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Foto Hasil</h3>
              <div className="flex space-x-2">
                <button
                  onClick={downloadPhoto}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
