"use client";
import React, { useState } from 'react';
import { MapPin, Camera, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import CameraCapture from './CameraCapture';

const AttendanceCheckIn = ({ employee, onSubmit, allowedLocations = [] }) => {
  const [step, setStep] = useState('location'); // location -> camera -> confirm
  const [attendanceData, setAttendanceData] = useState({
    photo: null,
    location: null,
    timestamp: null,
    type: 'check-in'
  });
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { location, loading: locationLoading, error: locationError, getCurrentLocation, validateLocation } = useGeolocation();

  const handleLocationCapture = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationData = await getCurrentLocation();
      
      // Validate if location is within allowed areas
      const isValidLocation = allowedLocations.length === 0 || allowedLocations.some(allowed => 
        validateLocation(allowed.latitude, allowed.longitude, allowed.radius || 100)
      );
      
      if (!isValidLocation) {
        setError('You are not in an authorized location for check-in');
        setLoading(false);
        return;
      }
      
      setAttendanceData(prev => ({
        ...prev,
        location: locationData,
        timestamp: new Date().toISOString()
      }));
      
      setStep('camera');
      setShowCamera(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (photoData) => {
    setAttendanceData(prev => ({
      ...prev,
      photo: photoData
    }));
    setShowCamera(false);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        ...attendanceData,
        employeeId: employee.id,
        employeeName: employee.name
      });
    } catch (err) {
      setError('Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('location');
    setAttendanceData({
      photo: null,
      location: null,
      timestamp: null,
      type: 'check-in'
    });
    setShowCamera(false);
    setError(null);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handlePhotoCapture}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Check In</h2>
        <p className="text-gray-600">Welcome, {employee.name}</p>
        <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Location */}
      {step === 'location' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <MapPin className="text-blue-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Location</h3>
            <p className="text-gray-600 text-sm mb-4">
              We need to verify your location for attendance
            </p>
          </div>
          
          <button
            onClick={handleLocationCapture}
            disabled={loading || locationLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || locationLoading ? 'Getting Location...' : 'Capture Location'}
          </button>
        </div>
      )}

      {/* Step 2: Camera (handled by CameraCapture component) */}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <CheckCircle className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Attendance</h3>
          </div>

          {/* Location Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Location
            </h4>
            <p className="text-sm text-gray-600">{attendanceData.location?.address}</p>
            <p className="text-xs text-gray-500">
              Lat: {attendanceData.location?.latitude?.toFixed(6)}, 
              Lng: {attendanceData.location?.longitude?.toFixed(6)}
            </p>
          </div>

          {/* Photo Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Camera size={16} />
              Photo
            </h4>
            <img
              src={attendanceData.photo}
              alt="Attendance photo"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>

          {/* Time Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Time
            </h4>
            <p className="text-sm text-gray-600">
              {new Date(attendanceData.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Confirm Check In'}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCheckIn;