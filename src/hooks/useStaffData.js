import { useState, useEffect } from 'react';
import { staffService } from '../services/staffService';

export const useStaffData = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch staff with role information
        const staffResponse = await staffService.getAllStaff();
        if (staffResponse.success) {
          setStaff(staffResponse.data || []); // Ubah dari staffResponse.data.users ke staffResponse.data
        } else {
          setError(staffResponse.message || 'Failed to load staff');
        }
        
        // Fetch roles
        const rolesResponse = await staffService.getAllRoles();
        if (rolesResponse.success) {
          setRoles(rolesResponse.data || []); // Ubah dari rolesResponse.data.roles ke rolesResponse.data
        } else {
          setError(rolesResponse.message || 'Failed to load roles');
        }
      } catch (err) {
        setError('Failed to load staff data');
        console.error('Error loading staff data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const addStaff = async (newStaff) => {
    try {
      setLoading(true);
      const response = await staffService.createStaff(newStaff);
      if (response.success) {
        // Refresh data dengan memanggil ulang getAllStaff untuk memastikan data terbaru
        const staffResponse = await staffService.getAllStaff();
        if (staffResponse.success) {
          setStaff(staffResponse.data || []);
        }
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error adding staff:', error);
      return { success: false, message: 'Failed to add staff member' };
    } finally {
      setLoading(false);
    }
  };

  const updateStaff = async (id, updatedStaff) => {
    try {
      setLoading(true);
      const response = await staffService.updateStaff(id, updatedStaff);
      if (response.success) {
        setStaff(prev => prev.map(s => s.id === id ? response.data.user : s));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error updating staff:', error);
      return { success: false, message: 'Failed to update staff member' };
    } finally {
      setLoading(false);
    }
  };

  const deleteStaff = async (id) => {
    try {
      setLoading(true);
      const response = await staffService.deleteStaff(id);
      if (response.success) {
        setStaff(prev => prev.filter(s => s.id !== id));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error deleting staff:', error);
      return { success: false, message: 'Failed to delete staff member' };
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (newRole) => {
    try {
      setLoading(true);
      const response = await staffService.createRole(newRole);
      if (response.success) {
        setRoles(prev => [...prev, response.data.role]);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error adding role:', error);
      return { success: false, message: 'Failed to add role' };
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, updatedRole) => {
    try {
      setLoading(true);
      const response = await staffService.updateRole(id, updatedRole);
      if (response.success) {
        setRoles(prev => prev.map(r => r.id === id ? response.data.role : r));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, message: 'Failed to update role' };
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id) => {
    try {
      setLoading(true);
      const response = await staffService.deleteRole(id);
      if (response.success) {
        setRoles(prev => prev.filter(r => r.id !== id));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Error deleting role:', error);
      return { success: false, message: 'Failed to delete role' };
    } finally {
      setLoading(false);
    }
  };

  return {
    staff,
    roles,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    addRole,
    updateRole,
    deleteRole,
    setStaff,
    setRoles
  };
};