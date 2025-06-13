import api from './api';

export const mealAllowanceService = {
  // Employee functions
  getMealAllowancePreview: async () => {
    const response = await api.get('/meal-allowance/preview');
    return response.data;
  },

  claimMealAllowance: async (attendanceId, notes = '') => {
    const response = await api.post('/meal-allowance/claim', {
      attendance_id: attendanceId,
      notes
    });
    return response.data;
  },
  
  getMyMealAllowances: async (params = {}) => {
    const response = await api.get('/meal-allowance/my', { params });
    return response.data;
  },
  
  // Admin functions
  getAllMealAllowances: async (params = {}) => {
    const response = await api.get('/meal-allowance/all', { params });
    return response.data;
  },
  
  updateMealAllowanceStatus: async (id, data) => {
    const response = await api.put(`/meal-allowance/${id}/status`, data);
    return response.data;
  },
  
  getMealAllowanceStats: async (params = {}) => {
    const response = await api.get('/meal-allowance/stats', { params });
    return response.data;
  }
};