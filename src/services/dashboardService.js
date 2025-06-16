import api from './api';

export const dashboardService = {
  // Get comprehensive employee dashboard data
  getEmployeeDashboard: async () => {
    try {
      const response = await api.get('/dashboard/employee');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee dashboard:', error);
      throw error;
    }
  },

  // Get quick employee summary
  getEmployeeSummary: async () => {
    try {
      const response = await api.get('/dashboard/employee/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching employee summary:', error);
      throw error;
    }
  }
};

export default dashboardService;