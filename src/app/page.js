"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, ShoppingCart, FileText, DollarSign, TrendingUp, AlertTriangle, Coffee, Users, LogOut } from 'lucide-react';
import Dashboard from '../components/dashboard/Dashboard';
import StockManagement from '../components/stock/StockManagement';
import MenuManagement from '../components/menu/MenuManagement';
import TransactionsView from '../components/transactions/TransactionsView';
import Reports from '../components/reports/Reports';
import StockModal from '../components/modals/StockModal';
import MenuModal from '../components/modals/MenuModal';
import TransactionModal from '../components/modals/TransactionModal';
import { useAuth } from '../context/AuthContext';

const CyberCafeManagement = () => {
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for Stock Management
  const [stock, setStock] = useState([
    { id: 1, name: 'Coffee Beans', quantity: 50, unit: 'kg', minLevel: 10, price: 25.99, category: 'Beverages' },
    { id: 2, name: 'Milk', quantity: 20, unit: 'liters', minLevel: 5, price: 3.50, category: 'Dairy' },
    { id: 3, name: 'Sugar', quantity: 15, unit: 'kg', minLevel: 5, price: 2.99, category: 'Sweeteners' },
    { id: 4, name: 'Bread', quantity: 30, unit: 'loaves', minLevel: 10, price: 1.99, category: 'Bakery' }
  ]);

  // State for Menu Management
  const [menu, setMenu] = useState([
    { id: 1, name: 'Espresso', price: 3.50, ingredients: ['Coffee Beans'], category: 'Hot Drinks', available: true },
    { id: 2, name: 'Cappuccino', price: 4.50, ingredients: ['Coffee Beans', 'Milk'], category: 'Hot Drinks', available: true },
    { id: 3, name: 'Toast', price: 2.99, ingredients: ['Bread'], category: 'Snacks', available: true }
  ]);

  // State for Transactions
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'purchase', item: 'Coffee Beans', quantity: 10, price: 259.90, date: '2024-01-15', supplier: 'Bean Co.' },
    { id: 2, type: 'sale', item: 'Cappuccino', quantity: 5, price: 22.50, date: '2024-01-15', customer: 'Table 3' },
    { id: 3, type: 'purchase', item: 'Milk', quantity: 15, price: 52.50, date: '2024-01-14', supplier: 'Dairy Farm' }
  ]);

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
    } else {
      setStock([...stock, { ...stockForm, id: Date.now() }]);
    }
    setShowStockModal(false);
    setStockForm({ name: '', quantity: '', unit: '', minLevel: '', price: '', category: '' });
    setEditingItem(null);
  };

  const editStock = (item) => {
    if (!isAdmin()) return;
    setEditingItem(item);
    setStockForm(item);
    setShowStockModal(true);
  };

  const deleteStock = (id) => {
    if (!isAdmin()) return;
    setStock(stock.filter(item => item.id !== id));
  };

  // Menu Management Functions
  const handleMenuSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setMenu(menu.map(item => item.id === editingItem.id ? { ...menuForm, id: editingItem.id } : item));
    } else {
      setMenu([...menu, { ...menuForm, id: Date.now() }]);
    }
    setShowMenuModal(false);
    setMenuForm({ name: '', price: '', ingredients: [], category: '', available: true });
    setEditingItem(null);
  };

  const editMenu = (item) => {
    if (!isAdmin()) return;
    setEditingItem(item);
    setMenuForm(item);
    setShowMenuModal(true);
  };

  const deleteMenu = (id) => {
    if (!isAdmin()) return;
    setMenu(menu.filter(item => item.id !== id));
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
    setShowTransactionModal(false);
    setTransactionForm({ type: 'purchase', item: '', quantity: '', price: '', supplier: '', customer: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coffee className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CyberCafe Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.username} ({user?.role}) | {new Date().toLocaleDateString()}
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'stock', label: 'Stock', icon: Package },
              { id: 'menu', label: 'Menu', icon: Coffee },
              { id: 'transactions', label: 'Transactions', icon: DollarSign },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && 
          <Dashboard 
            stock={stock} 
            menu={menu} 
            transactions={transactions} 
            setShowStockModal={isAdmin() ? setShowStockModal : null}
            setShowMenuModal={isAdmin() ? setShowMenuModal : null}
            setShowTransactionModal={isAdmin() ? setShowTransactionModal : null}
            isAdmin={isAdmin()}
          />
        }
        {activeTab === 'stock' && 
          <StockManagement 
            stock={stock} 
            editStock={editStock} 
            deleteStock={deleteStock} 
            setShowStockModal={isAdmin() ? setShowStockModal : null} 
            isAdmin={isAdmin()}
          />
        }
        {activeTab === 'menu' && 
          <MenuManagement 
            menu={menu} 
            editMenu={editMenu} 
            deleteMenu={deleteMenu} 
            setShowMenuModal={isAdmin() ? setShowMenuModal : null} 
            isAdmin={isAdmin()}
          />
        }
        {activeTab === 'transactions' && 
          <TransactionsView 
            transactions={transactions} 
            setShowTransactionModal={isAdmin() ? setShowTransactionModal : null} 
            isAdmin={isAdmin()}
          />
        }
        {activeTab === 'reports' && 
          <Reports 
            stock={stock} 
            transactions={transactions} 
          />
        }
      </main>

      {/* Modals - Only shown for admin users */}
      {isAdmin() && showStockModal && (
        <StockModal 
          editingItem={editingItem}
          stockForm={stockForm}
          setStockForm={setStockForm}
          handleStockSubmit={handleStockSubmit}
          setShowStockModal={setShowStockModal}
          setEditingItem={setEditingItem}
        />
      )}

      {isAdmin() && showMenuModal && (
        <MenuModal 
          editingItem={editingItem}
          menuForm={menuForm}
          setMenuForm={setMenuForm}
          handleMenuSubmit={handleMenuSubmit}
          setShowMenuModal={setShowMenuModal}
          setEditingItem={setEditingItem}
        />
      )}

      {isAdmin() && showTransactionModal && (
        <TransactionModal 
          transactionForm={transactionForm}
          setTransactionForm={setTransactionForm}
          handleTransactionSubmit={handleTransactionSubmit}
          setShowTransactionModal={setShowTransactionModal}
          stock={stock}
          menu={menu}
        />
      )}
    </div>
  );
};

export default CyberCafeManagement;