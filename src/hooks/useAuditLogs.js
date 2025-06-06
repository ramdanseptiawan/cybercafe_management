import { useState, useEffect } from 'react';
import api from '../services/api';

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchAuditLogs = async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        ...filters
      };
      
      const response = await api.get('/audit', { params });
      
      if (response.data.success) {
        setAuditLogs(response.data.data);
        setPagination(response.data.meta);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action, resource, details) => {
    // This function is not needed as the backend middleware
    // automatically logs actions, but we can keep it for manual logging
    try {
      // Manual logging could be implemented if needed
      // For now, just refresh the logs
      await fetchAuditLogs(pagination.page, pagination.limit);
    } catch (err) {
      console.error('Error logging action:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return { 
    auditLogs, 
    loading, 
    error, 
    pagination,
    fetchAuditLogs,
    logAction 
  };
};