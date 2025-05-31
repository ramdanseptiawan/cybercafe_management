import { useState } from 'react';
import { useAuditLogs } from './useAuditLogs';

export const useStaffData = () => {
  const { logAction } = useAuditLogs();
  
  const [staff, setStaff] = useState([
    { id: 1, username: 'admin', name: 'Admin User', role: 'admin', email: 'admin@cybercafe.com', phone: '081234567890', active: true },
    { id: 2, username: 'kitchen1', name: 'Kitchen Staff', role: 'kitchen', email: 'kitchen@cybercafe.com', phone: '081234567891', active: true },
    { id: 3, username: 'cashier1', name: 'Cashier Staff', role: 'cashier', email: 'cashier@cybercafe.com', phone: '081234567892', active: true }
  ]);
  
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrator', permissions: ['all'] },
    { id: 'manager', name: 'Manager', permissions: ['dashboard', 'stock', 'menu', 'transactions', 'reports', 'computers', 'sessions', 'customers', 'kitchen'] },
    { id: 'cashier', name: 'Cashier', permissions: ['transactions', 'sessions', 'customers'] },
    { id: 'kitchen', name: 'Kitchen Staff', permissions: ['kitchen', 'stock'] },
    { id: 'staff', name: 'General Staff', permissions: ['sessions', 'customers'] }
  ]);

  const addStaff = (newStaff) => {
    const processedStaff = {
      ...newStaff,
      id: Date.now(),
      active: newStaff.active !== undefined ? newStaff.active : true
    };
    setStaff([...staff, processedStaff]);
    logAction('create', `Added new staff member: ${processedStaff.name}`);
  };
  
  const updateStaff = (updatedStaff) => {
    setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    logAction('update', `Updated staff member: ${updatedStaff.name}`);
  };
  
  const deleteStaff = (id) => {
    try {
      const staffToDelete = staff.find(s => s.id === id);
      if (!staffToDelete) {
        console.error('Staff member not found');
        return;
      }
      setStaff(staff.filter(s => s.id !== id));
      logAction('delete', `Deleted staff member: ${staffToDelete.name}`);
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const addRole = (newRole) => {
    const processedRole = {
      ...newRole,
      id: Date.now(),
      permissions: newRole.permissions || []
    };
    setRoles([...roles, processedRole]);
    logAction('create', `Added new role: ${processedRole.name}`);
  };
  
  const updateRole = (updatedRole) => {
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    logAction('update', `Updated role: ${updatedRole.name}`);
  };
  
  const deleteRole = (id) => {
    try {
      const roleToDelete = roles.find(r => r.id === id);
      if (!roleToDelete) {
        console.error('Role not found');
        return;
      }
      setRoles(roles.filter(r => r.id !== id));
      logAction('delete', `Deleted role: ${roleToDelete.name}`);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  return {
    staff,
    roles,
    setStaff,
    setRoles,
    addStaff,
    updateStaff,
    deleteStaff,
    addRole,
    updateRole,
    deleteRole
  };
};