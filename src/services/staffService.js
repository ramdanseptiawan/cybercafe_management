import api from './api';

export const staffService = {
  getAllStaff: async (params = {}) => {
    const response = await api.get('/staff', { params });
    return response.data;
  },
  
  getStaffById: async (id) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },
  
  createStaff: async (staffData) => {
    const response = await api.post('/staff', staffData);
    return response.data;
  },
  
  updateStaff: async (id, staffData) => {
    const response = await api.put(`/staff/${id}`, staffData);
    return response.data;
  },
  
  deleteStaff: async (id) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  
  // Role management
  getAllRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
  
  createRole: async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },
  
  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },
  
  deleteRole: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }
};