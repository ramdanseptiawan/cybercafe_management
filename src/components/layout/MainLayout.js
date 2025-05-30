import React from 'react';
import { Coffee, Users, LogOut, Monitor, Clock, Settings, Menu as MenuIcon, ChevronLeft, Plus, Edit, Trash2, Package, ShoppingCart, FileText, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import Dashboard from '../dashboard/Dashboard';
import DashboardStats from '../dashboard/DashboardStats';
import StockManagement from '../stock/StockManagement';
import MenuManagement from '../menu/MenuManagement';
import TransactionsView from '../transactions/TransactionsView';
import Reports from '../reports/Reports';
import ComputerManagement from '../computers/ComputerManagement';
import SessionManagement from '../sessions/SessionManagement';
import CustomerManagement from '../customers/CustomerManagement';
import KitchenManagement from '../kitchen/KitchenManagement';
import StockModal from '../modals/StockModal';
import MenuModal from '../modals/MenuModal';
import TransactionModal from '../modals/TransactionModal';
import StaffManagement from '../settings/StaffManagement';
import AuditLogs from '../settings/AuditLogs';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ user, logout, isAdmin, state, handlers, modals }) => {
  const { 
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
  } = state;

  const {
    setActiveTab,
    setSidebarCollapsed,
    setSettingsTab,
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
    setComputers,
    setActiveSessions,
    setCustomers,
    setOrders,
    setStockForm,
    setMenuForm,
    setTransactionForm,
    setEditingItem,
    logAction
  } = handlers;

  const {
    showStockModal,
    setShowStockModal,
    showMenuModal,
    setShowMenuModal,
    showTransactionModal,
    setShowTransactionModal
  } = modals;

  return (
    <div className="flex h-screen bg-gray-100 text-black overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        logout={logout}
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <>
              <DashboardStats 
                computers={computers}
                activeSessions={activeSessions}
                customers={customers}
                orders={orders}
                stock={stock}
                transactions={transactions}
              />
              <div className="mt-6">
                <Dashboard 
                  stock={stock} 
                  menu={menu} 
                  transactions={transactions} 
                  computers={computers}
                  setShowStockModal={isAdmin ? setShowStockModal : null}
                  setShowMenuModal={isAdmin ? setShowMenuModal : null}
                  setShowTransactionModal={isAdmin ? setShowTransactionModal : null}
                  isAdmin={isAdmin}
                />
              </div>
            </>
          )}
          {activeTab === 'stock' && 
            <StockManagement 
              stock={stock} 
              editStock={editStock} 
              deleteStock={deleteStock} 
              setShowStockModal={isAdmin ? setShowStockModal : null} 
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'menu' && 
            <MenuManagement 
              menu={menu} 
              editMenu={editMenu} 
              deleteMenu={deleteMenu} 
              setShowMenuModal={isAdmin ? setShowMenuModal : null} 
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'transactions' && 
            <TransactionsView 
              transactions={transactions} 
              setShowTransactionModal={isAdmin ? setShowTransactionModal : null} 
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'reports' && 
            <Reports 
              stock={stock} 
              transactions={transactions} 
            />
          }
          {activeTab === 'computers' && 
            <ComputerManagement 
              computers={computers}
              setComputers={setComputers}
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'sessions' && 
            <SessionManagement 
              activeSessions={activeSessions}
              setActiveSessions={setActiveSessions}
              computers={computers}
              timePackages={timePackages}
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'customers' && 
            <CustomerManagement 
              customers={customers}
              setCustomers={setCustomers}
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'kitchen' && 
            <KitchenManagement 
              menu={menu}
              stock={stock}
              orders={orders}
              setOrders={setOrders}
              isAdmin={isAdmin}
            />
          }
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      onClick={() => setSettingsTab('general')}
                      className={`px-4 py-3 text-sm font-medium ${
                        settingsTab === 'general'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      General
                    </button>
                    <button
                      onClick={() => setSettingsTab('staff')}
                      className={`px-4 py-3 text-sm font-medium ${
                        settingsTab === 'staff'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Staff Management
                    </button>
                    <button
                      onClick={() => setSettingsTab('logs')}
                      className={`px-4 py-3 text-sm font-medium ${
                        settingsTab === 'logs'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Audit Logs
                    </button>
                  </nav>
                </div>
                <div className="p-6">
                  {settingsTab === 'general' && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
                      <p className="text-gray-500">General system settings will be displayed here.</p>
                    </div>
                  )}
                  {settingsTab === 'staff' && (
                    <StaffManagement 
                      staff={staff}
                      roles={roles}
                      addStaff={addStaff}
                      updateStaff={updateStaff}
                      deleteStaff={deleteStaff}
                      addRole={addRole}
                      updateRole={updateRole}
                      deleteRole={deleteRole}
                      logAction={logAction}
                    />
                  )}
                  {settingsTab === 'logs' && (
                    <AuditLogs 
                      logs={auditLogs}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals - Only shown for admin users */}
      {isAdmin && showStockModal && (
        <StockModal 
          editingItem={editingItem}
          stockForm={stockForm}
          setStockForm={setStockForm}
          handleStockSubmit={handleStockSubmit}
          setShowStockModal={setShowStockModal}
          setEditingItem={setEditingItem}
        />
      )}

      {isAdmin && showMenuModal && (
        <MenuModal 
          editingItem={editingItem}
          menuForm={menuForm}
          setMenuForm={setMenuForm}
          handleMenuSubmit={handleMenuSubmit}
          setShowMenuModal={setShowMenuModal}
          setEditingItem={setEditingItem}
        />
      )}

      {isAdmin && showTransactionModal && (
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

export default MainLayout;