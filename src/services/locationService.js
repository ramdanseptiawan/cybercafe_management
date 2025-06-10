import api from './api';

export const locationService = {
  getAllLocations: async (params = {}) => {
    const response = await api.get('/attendance/locations', { params });
    return response.data;
  },
  
  getLocationById: async (id) => {
    const response = await api.get(`/attendance/locations/${id}`);
    return response.data;
  },
  
  createLocation: async (locationData) => {
    const response = await api.post('/attendance/locations', locationData);
    return response.data;
  },
  
  updateLocation: async (id, locationData) => {
    const response = await api.put(`/attendance/locations/${id}`, locationData);
    return response.data;
  },
  
  deleteLocation: async (id) => {
    const response = await api.delete(`/attendance/locations/${id}`);
    return response.data;
  },
  
  getNearbyLocations: async (params) => {
    const response = await api.get('/attendance/locations/nearby', { params });
    return response.data;
  },
  
  validateLocation: async (locationData) => {
    const response = await api.post('/attendance/locations/validate', locationData);
    return response.data;
  }
};