import React from 'react';
import Dashboard from '../dashboard/Dashboard';
import StockManagement from '../stock/StockManagement';
import MenuManagement from '../menu/MenuManagement';
import TransactionsView from '../transactions/TransactionsView';
import Reports from '../reports/Reports';
import ComputerManagement from '../computers/ComputerManagement';
import SessionManagement from '../sessions/SessionManagement';
import CustomerManagement from '../customers/CustomerManagement';
import KitchenManagement from '../kitchen/KitchenManagement';
import AttendanceManagement from '../attendance/AttendanceManagement';
import StaffManagement from '../settings/StaffManagement';
import AuditLogs from '../settings/AuditLogs';
import IndividualAttendance from '../attendance/IndividualAttendance';
import { useAuth } from '../../context/AuthContext';
import EmployeeDashboard from '../dashboard/EmployeeDashboard';

const TabContent = ({ activeTab, settingsTab, setSettingsTab, state, handlers, isAdmin, modals }) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const hasAccess = (requiredPermission) => {
    if (!user) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Check specific permissions
    if (user.permissions?.includes('all')) return true;
    if (user.permissions?.includes(requiredPermission)) return true;
    
    return false;
  };
  
  // Debug info
  console.log('TabContent Debug:', { user, userRole, activeTab, isAdmin });
  
  const {
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
    auditLogs
  } = state;

  const {
    addStock,
    editStock,
    deleteStock,
    addMenu,
    editMenu,
    deleteMenu,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addComputer,
    editComputer,
    deleteComputer,
    startSession,
    endSession,
    addCustomer,
    editCustomer,
    deleteCustomer,
    addOrder,
    editOrder,
    deleteOrder,
    updateOrderStatus,
    addStaff,
    editStaff,
    deleteStaff
  } = handlers;

  const {
    setShowStockModal,
    setShowMenuModal,
    setShowTransactionModal
  } = modals;

  // Remove this duplicate hasAccess function (lines 84-90)
  // const hasAccess = (requiredRole) => {
  //   if (requiredRole === 'admin') return userRole === 'admin';
  //   if (requiredRole === 'viewer') return userRole === 'viewer' || userRole === 'admin';
  //   if (requiredRole === 'employee') return userRole === 'employee';
  //   return false;
  // };

  // Access Denied Component
  const AccessDenied = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don&apos;t have permission to access this section.</p>
      </div>
    </div>
  );

  // Render content based on active tab and user role
  return (
    <>
      {activeTab === 'dashboard' && (
        userRole === 'admin' ? (
          <Dashboard 
            stock={stock}
            menu={menu}
            transactions={transactions}
            activeSessions={activeSessions}
            computers={computers}
            customers={customers}
            orders={orders}
            setActiveTab={handlers.setActiveTab}
            setShowStockModal={userRole === 'admin' ? setShowStockModal : null}
            setShowMenuModal={userRole === 'admin' ? setShowMenuModal : null}
            setShowTransactionModal={userRole === 'admin' ? setShowTransactionModal : null}
            isAdmin={userRole === 'admin'}
            userRole={userRole}
          />
        ) : (
          <EmployeeDashboard 
            user={user}
            orders={orders}
            activeSessions={activeSessions}
            computers={computers}
            setActiveTab={handlers.setActiveTab}
            todayAttendance={null} // You can pass actual attendance data here
          />
        )
      )}
      
      {/* ADMIN ONLY SECTIONS */}
      {activeTab === 'stock' && (
        hasAccess('admin') ? (
          <StockManagement 
            stock={stock} 
            editStock={editStock} 
            deleteStock={deleteStock} 
            setShowStockModal={setShowStockModal} 
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'menu' && (
        hasAccess('admin') ? (
          <MenuManagement 
            menu={menu} 
            editMenu={editMenu} 
            deleteMenu={deleteMenu} 
            setShowMenuModal={setShowMenuModal} 
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'transactions' && (
        hasAccess('admin') ? (
          <TransactionsView 
            transactions={transactions} 
            editTransaction={editTransaction} 
            deleteTransaction={deleteTransaction} 
            setShowTransactionModal={setShowTransactionModal} 
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'computers' && (
        hasAccess('viewer') ? (
          <ComputerManagement 
            computers={computers} 
            addComputer={userRole === 'admin' ? addComputer : null} 
            editComputer={userRole === 'admin' ? editComputer : null} 
            deleteComputer={userRole === 'admin' ? deleteComputer : null} 
            isAdmin={userRole === 'admin'}
            readOnly={userRole === 'viewer'}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'sessions' && (
        hasAccess('viewer') ? (
          <SessionManagement 
            activeSessions={activeSessions} 
            computers={computers} 
            timePackages={timePackages} 
            customers={customers} 
            startSession={userRole === 'admin' ? startSession : null} 
            endSession={userRole === 'admin' ? endSession : null} 
            isAdmin={userRole === 'admin'}
            readOnly={userRole === 'viewer'}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'customers' && (
        hasAccess('admin') ? (
          <CustomerManagement 
            customers={customers} 
            addCustomer={addCustomer} 
            editCustomer={editCustomer} 
            deleteCustomer={deleteCustomer} 
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'kitchen' && (
        hasAccess('admin') ? (
          <KitchenManagement 
            menu={menu}
            stock={stock}
            orders={orders} 
            updateOrderStatus={updateOrderStatus}
            setOrders={updateOrderStatus}
            setStock={editStock}
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'reports' && (
        hasAccess('viewer') ? (
          <Reports 
            transactions={transactions} 
            stock={stock} 
            menu={menu} 
            computers={computers}
            activeSessions={activeSessions}
            readOnly={userRole === 'viewer'}
          />
        ) : <AccessDenied />
      )}
      
      {activeTab === 'attendance' && (
        hasAccess('admin') ? (
          <AttendanceManagement 
            staff={staff}
            isAdmin={true}
          />
        ) : <AccessDenied />
      )}
      
      {/* EMPLOYEE ONLY SECTIONS */}
      {activeTab === 'individual-attendance' && (
        hasAccess('employee') ? (
          <IndividualAttendance 
            currentUser={{
              id: user?.id || 'EMP001',
              name: user?.name || 'Employee',
              department: user?.department || 'General',
              role: 'employee'
            }}
          />
        ) : <AccessDenied />
      )}
      
      {/* ADMIN SETTINGS */}
      {activeTab === 'settings' && (
        hasAccess('admin') ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      settingsTab === 'general'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setSettingsTab('staff')}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      settingsTab === 'staff'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Staff Management
                  </button>
                  <button
                    onClick={() => setSettingsTab('audit')}
                    className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      settingsTab === 'audit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Audit Logs
                  </button>
                </nav>
              </div>
              <div className="p-4 sm:p-6">
                {settingsTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cafe Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue="CyberCafe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Operating Hours
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue="24/7"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {settingsTab === 'staff' && (
                  <StaffManagement 
                    staff={staff}
                    roles={roles}
                    addStaff={addStaff}
                    editStaff={editStaff}
                    deleteStaff={deleteStaff}
                    isAdmin={true}
                  />
                )}
                
                {settingsTab === 'audit' && (
                  <AuditLogs 
                    logs={auditLogs}
                    isAdmin={true}
                  />
                )}
              </div>
            </div>
          </div>
        ) : <AccessDenied />
      )}
    </>
  );
};

export default TabContent;
