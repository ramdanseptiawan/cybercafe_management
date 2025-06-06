import api from './api';

export const attendanceService = {
  checkIn: async (formData) => {
    // Using FormData for file upload
    const response = await api.post('/attendance/check-in', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  checkOut: async (formData) => {
    // Using FormData for file upload
    const response = await api.post('/attendance/check-out', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getMyAttendance: async (params = {}) => {
    const response = await api.get('/attendance/my', { params });
    return response.data;
  },
  
  getAllAttendance: async (params = {}) => {
    const response = await api.get('/attendance/all', { params });
    return response.data;
  },
  
  getAttendanceStats: async (params = {}) => {
    const response = await api.get('/attendance/stats', { params });
    return response.data;
  },
  
  getTodayAttendance: async () => {
    const response = await api.get('/attendance/today');
    return response.data;
  },
  
  updateAttendance: async (id, data) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
  
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  }
};