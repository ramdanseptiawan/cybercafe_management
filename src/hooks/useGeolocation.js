"use client";
import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationValidated, setLocationValidated] = useState(false);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setError(error);
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);
      setLocationValidated(false);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };

          // Get address from coordinates (reverse geocoding)
          try {
            const address = await reverseGeocode(coords.latitude, coords.longitude);
            const locationData = { ...coords, address };
            setLocation(locationData);
            setLoading(false);
            resolve(locationData);
          } catch (geoError) {
            const locationData = { ...coords, address: 'Address not available' };
            setLocation(locationData);
            setLoading(false);
            resolve(locationData);
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setError(errorMessage);
          setLoading(false);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    });
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.display_name || data.locality || 'Address not found';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Address not available';
    }
  };

  const validateLocation = useCallback((targetLat, targetLng, maxDistance = 100) => {
    if (!location) {
      setLocationValidated(false);
      return false;
    }
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      targetLat,
      targetLng
    );
    
    const isValid = distance <= maxDistance;
    setLocationValidated(isValid);
    return isValid;
  }, [location]);

  const validateMultipleLocations = useCallback((allowedLocations) => {
    if (!location || !allowedLocations || allowedLocations.length === 0) {
      // Jika tidak ada lokasi yang dibatasi, anggap valid
      setLocationValidated(true);
      return { isValid: true, distance: 0, nearestLocation: null };
    }

    let minDistance = Infinity;
    let nearestLocation = null;
    let isValid = false;

    allowedLocations.forEach(allowed => {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        allowed.latitude,
        allowed.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = allowed;
      }
      
      // Perbaikan: gunakan toleransi yang lebih besar untuk GPS accuracy
      const allowedRadius = allowed.radius || 100;
      const gpsAccuracyBuffer = Math.max(location.accuracy || 10, 10); // minimum 10m buffer
      const effectiveRadius = allowedRadius + gpsAccuracyBuffer;
      
      if (distance <= effectiveRadius) {
        isValid = true;
      }
    });

    setLocationValidated(isValid);
    return {
      isValid,
      distance: minDistance,
      nearestLocation,
      currentLocation: location,
      effectiveRadius: nearestLocation ? (nearestLocation.radius || 100) + Math.max(location.accuracy || 10, 10) : null
    };
  }, [location]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // Distance in meters
  };

  return {
    location,
    loading,
    error,
    locationValidated,
    getCurrentLocation,
    validateLocation,
    validateMultipleLocations,
    calculateDistance
  };
};