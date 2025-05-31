import { useState } from 'react';
import { initialData } from '../data/initialData';
import { useAuditLogs } from './useAuditLogs';

export const useCustomerData = () => {
  const { customersData } = initialData;
  const { logAction } = useAuditLogs();
  
  const [customers, setCustomers] = useState(customersData);

  const addCustomer = (newCustomer) => {
    const processedCustomer = {
      ...newCustomer,
      id: Date.now(),
      points: parseFloat(newCustomer.points) || 0,
      visits: parseFloat(newCustomer.visits) || 0,
      totalSpent: parseFloat(newCustomer.totalSpent) || 0,
      preferredGames: newCustomer.preferredGames || []
    };
    setCustomers([...customers, processedCustomer]);
    logAction('create', `Added new customer: ${processedCustomer.name}`);
  };

  const updateCustomer = (updatedCustomer) => {
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    logAction('update', `Updated customer: ${updatedCustomer.name}`);
  };

  const deleteCustomer = (id) => {
    try {
      const customerToDelete = customers.find(c => c.id === id);
      if (!customerToDelete) {
        console.error('Customer not found');
        return;
      }
      setCustomers(customers.filter(c => c.id !== id));
      logAction('delete', `Deleted customer: ${customerToDelete.name}`);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  };
};