import { useState } from 'react';
import { initialData } from '../data/initialData';
import { useAuditLogs } from './useAuditLogs';
import { useStockData } from './useStockData';
import { useMenuData } from './useMenuData';
import { useCustomerData } from './useCustomerData';
import { useStaffData } from './useStaffData';

export const useCafeData = () => {
  const { transactionsData, computersData, activeSessionsData, timePackagesData, ordersData } = initialData;
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  
  // Core Data (non-CRUD)
  const [transactions, setTransactions] = useState(transactionsData);
  const [computers, setComputers] = useState(computersData);
  const [activeSessions, setActiveSessions] = useState(activeSessionsData);
  const [timePackages, setTimePackages] = useState(timePackagesData);
  const [orders, setOrders] = useState(ordersData);
  
  // Transaction form
  const [transactionForm, setTransactionForm] = useState({ 
    type: 'purchase', 
    item: '', 
    quantity: '', 
    price: '', 
    supplier: '', 
    customer: '' 
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Domain-specific hooks
  const stockData = useStockData();
  const menuData = useMenuData();
  const customerData = useCustomerData();
  const staffData = useStaffData();
  const { auditLogs, logAction } = useAuditLogs();

  // Transaction Functions
  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    
    const processedForm = {
      ...transactionForm,
      quantity: parseFloat(transactionForm.quantity) || 0,
      price: parseFloat(transactionForm.price) || 0
    };
    
    const newTransaction = {
      ...processedForm,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    
    setTransactions([...transactions, newTransaction]);
    logAction('create', `Created new ${processedForm.type} transaction: ${processedForm.item}`);
    
    setShowTransactionModal(false);
    setTransactionForm({ 
      type: 'purchase', 
      item: '', 
      quantity: '', 
      price: '', 
      supplier: '', 
      customer: '' 
    });
  };

  return {
    state: {
      activeTab,
      sidebarCollapsed,
      settingsTab,
      stock: stockData.stock,
      menu: menuData.menu,
      transactions,
      computers,
      activeSessions,
      timePackages,
      customers: customerData.customers,
      orders,
      staff: staffData.staff,
      roles: staffData.roles,
      auditLogs,
      stockForm: stockData.stockForm,
      menuForm: menuData.menuForm,
      transactionForm,
      editingItem: stockData.editingItem || menuData.editingItem
    },
    handlers: {
      setActiveTab,
      setSidebarCollapsed,
      setSettingsTab,
      setStock: stockData.setStock,
      setMenu: menuData.setMenu,
      setTransactions,
      setComputers,
      setActiveSessions,
      setTimePackages,
      setCustomers: customerData.setCustomers,
      setOrders,
      setStaff: staffData.setStaff,
      setRoles: staffData.setRoles,
      logAction,
      // Stock handlers
      handleStockSubmit: stockData.handleStockSubmit,
      addStock: stockData.addStock,
      editStock: stockData.editStock,
      deleteStock: stockData.deleteStock,
      setStockForm: stockData.setStockForm,
      // Menu handlers
      handleMenuSubmit: menuData.handleMenuSubmit,
      editMenu: menuData.editMenu,
      deleteMenu: menuData.deleteMenu,
      setMenuForm: menuData.setMenuForm,
      // Customer handlers
      addCustomer: customerData.addCustomer,
      updateCustomer: customerData.updateCustomer,
      deleteCustomer: customerData.deleteCustomer,
      // Staff handlers
      addStaff: staffData.addStaff,
      updateStaff: staffData.updateStaff,
      deleteStaff: staffData.deleteStaff,
      addRole: staffData.addRole,
      updateRole: staffData.updateRole,
      deleteRole: staffData.deleteRole,
      // Transaction handlers
      handleTransactionSubmit,
      setTransactionForm,
      setEditingItem: stockData.setEditingItem
    },
    modals: {
      showStockModal: stockData.showStockModal,
      setShowStockModal: stockData.setShowStockModal,
      showMenuModal: menuData.showMenuModal,
      setShowMenuModal: menuData.setShowMenuModal,
      showTransactionModal,
      setShowTransactionModal
    }
  };
};