import { useState } from 'react';
import { initialData } from '../data/initialData';
import { useAuditLogs } from './useAuditLogs';

export const useCafeData = () => {
  // Get initial data
  const {
    stockData,
    menuData,
    transactionsData,
    computersData,
    activeSessionsData,
    timePackagesData,
    customersData,
    ordersData
  } = initialData;

  // State for active tab and sidebar
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  
  // State for data
  const [stock, setStock] = useState(stockData);
  const [menu, setMenu] = useState(menuData);
  const [transactions, setTransactions] = useState(transactionsData);
  const [computers, setComputers] = useState(computersData);
  const [activeSessions, setActiveSessions] = useState(activeSessionsData);
  const [timePackages, setTimePackages] = useState(timePackagesData);
  const [customers, setCustomers] = useState(customersData);
  const [orders, setOrders] = useState(ordersData);

  // Staff and roles management
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

  // Audit logs functionality
  const { auditLogs, logAction } = useAuditLogs();

  // Modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [stockForm, setStockForm] = useState({ name: '', quantity: '', unit: '', minLevel: '', price: '', category: '' });
  const [menuForm, setMenuForm] = useState({ name: '', price: '', ingredients: [], category: '', available: true });
  const [transactionForm, setTransactionForm] = useState({ type: 'purchase', item: '', quantity: '', price: '', supplier: '', customer: '' });

  // Stock Management Functions
  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setStock(stock.map(item => item.id === editingItem.id ? { ...stockForm, id: editingItem.id } : item));
      logAction('update', `Updated stock item: ${stockForm.name}`);
    } else {
      setStock([...stock, { ...stockForm, id: Date.now() }]);
      logAction('create', `Created new stock item: ${stockForm.name}`);
    }
    setShowStockModal(false);
    setStockForm({ name: '', quantity: '', unit: '', minLevel: '', price: '', category: '' });
    setEditingItem(null);
  };

  const editStock = (item) => {
    setEditingItem(item);
    setStockForm(item);
    setShowStockModal(true);
  };

  const deleteStock = (id) => {
    const itemToDelete = stock.find(item => item.id === id);
    setStock(stock.filter(item => item.id !== id));
    logAction('delete', `Deleted stock item: ${itemToDelete.name}`);
  };

  // Menu Management Functions
  const handleMenuSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setMenu(menu.map(item => item.id === editingItem.id ? { ...menuForm, id: editingItem.id } : item));
      logAction('update', `Updated menu item: ${menuForm.name}`);
    } else {
      setMenu([...menu, { ...menuForm, id: Date.now() }]);
      logAction('create', `Created new menu item: ${menuForm.name}`);
    }
    setShowMenuModal(false);
    setMenuForm({ name: '', price: '', ingredients: [], category: '', available: true });
    setEditingItem(null);
  };

  const editMenu = (item) => {
    setEditingItem(item);
    setMenuForm(item);
    setShowMenuModal(true);
  };

  const deleteMenu = (id) => {
    const itemToDelete = menu.find(item => item.id === id);
    setMenu(menu.filter(item => item.id !== id));
    logAction('delete', `Deleted menu item: ${itemToDelete.name}`);
  };

  // Transaction Functions
  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    const newTransaction = {
      ...transactionForm,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions([...transactions, newTransaction]);
    logAction('create', `Created new ${transactionForm.type} transaction: ${transactionForm.item}`);
    setShowTransactionModal(false);
    setTransactionForm({ type: 'purchase', item: '', quantity: '', price: '', supplier: '', customer: '' });
  };

  // Staff management functions
  const addStaff = (newStaff) => {
    setStaff([...staff, { ...newStaff, id: Date.now() }]);
    logAction('create', `Added new staff member: ${newStaff.name}`);
  };
  
  const updateStaff = (updatedStaff) => {
    setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    logAction('update', `Updated staff member: ${updatedStaff.name}`);
  };
  
  const deleteStaff = (id) => {
    const staffToDelete = staff.find(s => s.id === id);
    setStaff(staff.filter(s => s.id !== id));
    logAction('delete', `Deleted staff member: ${staffToDelete.name}`);
  };
  
  // Role management functions
  const addRole = (newRole) => {
    setRoles([...roles, { ...newRole, id: Date.now().toString() }]);
    logAction('create', `Added new role: ${newRole.name}`);
  };
  
  const updateRole = (updatedRole) => {
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    logAction('update', `Updated role: ${updatedRole.name}`);
  };
  
  const deleteRole = (id) => {
    const roleToDelete = roles.find(r => r.id === id);
    setRoles(roles.filter(r => r.id !== id));
    logAction('delete', `Deleted role: ${roleToDelete.name}`);
  };

  return {
    state: {
      activeTab,
      sidebarCollapsed,
      settingsTab,
      stock,
      menu,
      transactions,
      computers,
      activeSessions,
      timePackages,
      customers,
      orders,
      staff,
      roles,
      auditLogs,
      stockForm,
      menuForm,
      transactionForm,
      editingItem
    },
    handlers: {
      setActiveTab,
      setSidebarCollapsed,
      setSettingsTab,
      setStock,
      setMenu,
      setTransactions,
      setComputers,
      setActiveSessions,
      setTimePackages,
      setCustomers,
      setOrders,
      setStaff,
      setRoles,
      logAction,
      handleStockSubmit,
      editStock,
      deleteStock,
      handleMenuSubmit,
      editMenu,
      deleteMenu,
      handleTransactionSubmit,
      addStaff,
      updateStaff,
      deleteStaff,
      addRole,
      updateRole,
      deleteRole,
      setStockForm,
      setMenuForm,
      setTransactionForm,
      setEditingItem
    },
    modals: {
      showStockModal,
      setShowStockModal,
      showMenuModal,
      setShowMenuModal,
      showTransactionModal,
      setShowTransactionModal
    }
  };
};