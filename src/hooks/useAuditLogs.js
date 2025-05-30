import { useState } from 'react';

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: 'admin', action: 'login', details: 'User logged in', timestamp: '2024-01-15T08:30:00.000Z', ip: '192.168.1.100' },
    { id: 2, user: 'admin', action: 'create', details: 'Created new menu item: Espresso', timestamp: '2024-01-15T09:15:00.000Z', ip: '192.168.1.100' },
    { id: 3, user: 'kitchen1', action: 'update', details: 'Updated order status to completed', timestamp: '2024-01-15T10:45:00.000Z', ip: '192.168.1.101' }
  ]);

  const logAction = (action, details, user = 'system') => {
    const newLog = {
      id: Date.now(),
      user,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.100' // In a real app, you would get the actual IP
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  return { auditLogs, logAction };
};