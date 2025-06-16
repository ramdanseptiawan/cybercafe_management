import api from './api';

// Employee functions
export const getMealAllowancePreview = async (month, year) => {
  try {
    const response = await api.get('/meal-allowance/preview', {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting meal allowance preview:', error);
    throw error;
  }
};

export const claimMealAllowance = async (claimData) => {
  try {
    const response = await api.post('/meal-allowance/claim', claimData);
    return response.data;
  } catch (error) {
    console.error('Error claiming meal allowance:', error);
    throw error;
  }
};

export const getMyMealAllowances = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = { page, limit, ...filters };
    const response = await api.get('/meal-allowance/my', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting my meal allowances:', error);
    throw error;
  }
};

// Admin functions
export const getAllMealAllowances = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = { page, limit, ...filters };
    const response = await api.get('/meal-allowance/all', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting all meal allowances:', error);
    throw error;
  }
};

export const approveMealAllowance = async (id) => {
  try {
    const response = await api.put(`/meal-allowance/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving meal allowance:', error);
    throw error;
  }
};

export const rejectMealAllowance = async (id, reason) => {
  try {
    const response = await api.put(`/meal-allowance/${id}/reject`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error rejecting meal allowance:', error);
    throw error;
  }
};

export const getMealAllowancePolicy = async () => {
  try {
    const response = await api.get('/meal-allowance/policy');
    return response.data;
  } catch (error) {
    console.error('Error getting meal allowance policy:', error);
    throw error;
  }
};

export const updateMealAllowancePolicy = async (policyData) => {
  try {
    const response = await api.put('/meal-allowance/policy', policyData);
    return response.data;
  } catch (error) {
    console.error('Error updating meal allowance policy:', error);
    throw error;
  }
};

// Management functions for admin
export const getMealAllowanceManagement = async (month, year) => {
  try {
    const response = await api.get('/meal-allowance/management', {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting meal allowance management data:', error);
    throw error;
  }
};

export const getEmployeeAttendanceDetail = async (userId, month, year) => {
  try {
    const response = await api.get(`/attendance/employee/${userId}/detail`, {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting employee attendance detail:', error);
    throw error;
  }
};

export const getMealAllowanceStats = async (month, year) => {
  try {
    const response = await api.get('/meal-allowance/stats', {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting meal allowance stats:', error);
    throw error;
  }
};

export const updateMealAllowanceStatus = async (id, status, reason = null) => {
  try {
    const endpoint = status === 'approved' ? 'approve' : 'reject';
    const data = status === 'rejected' && reason ? { reason } : {};
    const response = await api.put(`/meal-allowance/${id}/${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating meal allowance status:', error);
    throw error;
  }
};

// Legacy support
export const mealAllowanceService = {
  getMealAllowancePreview,
  claimMealAllowance,
  getMyMealAllowances,
  getAllMealAllowances,
  approveMealAllowance,
  rejectMealAllowance,
  getMealAllowancePolicy,
  updateMealAllowancePolicy,
  getMealAllowanceManagement,
  getEmployeeAttendanceDetail,
  getMealAllowanceStats,
  updateMealAllowanceStatus
};

export default mealAllowanceService;