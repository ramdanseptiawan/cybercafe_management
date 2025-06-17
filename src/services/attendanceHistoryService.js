import api from './api';

export const attendanceHistoryService = {
  // Get attendance history with filters
  getAttendanceHistory: async (params = {}) => {
    try {
      const response = await api.get('/attendance/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      throw error;
    }
  },

  // Get attendance statistics by period
  getAttendanceStatsByPeriod: async (params = {}) => {
    try {
      const response = await api.get('/attendance/history/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error;
    }
  },

  // Export attendance history to CSV
  exportAttendanceHistory: async (params = {}) => {
    try {
      const response = await api.get('/attendance/history/export', {
        params,
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      link.setAttribute('download', `attendance_history_${dateStr}.csv`);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'File downloaded successfully' };
    } catch (error) {
      console.error('Error exporting attendance history:', error);
      throw error;
    }
  }
};

export default attendanceHistoryService;