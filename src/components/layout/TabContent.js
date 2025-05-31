import Dashboard from '../dashboard/Dashboard';
// import DashboardStats from '../dashboard/DashboardStats'; // Tidak digunakan lagi
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

const TabContent = ({ activeTab, settingsTab, setSettingsTab, state, handlers, isAdmin, modals }) => {
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

  // Render konten berdasarkan tab aktif
  return (
    <>
      {activeTab === 'dashboard' && (
        <Dashboard 
          stock={stock}
          menu={menu}
          transactions={transactions}
          activeSessions={activeSessions}
          computers={computers}
          customers={customers}
          orders={orders}
          setActiveTab={handlers.setActiveTab}
          setShowStockModal={isAdmin ? setShowStockModal : null}
          setShowMenuModal={isAdmin ? setShowMenuModal : null}
          setShowTransactionModal={isAdmin ? setShowTransactionModal : null}
          isAdmin={isAdmin}
        />
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
          editTransaction={editTransaction} 
          deleteTransaction={deleteTransaction} 
          setShowTransactionModal={isAdmin ? setShowTransactionModal : null} 
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'reports' && 
        <Reports 
          transactions={transactions} 
          stock={stock} 
          menu={menu} 
          computers={computers}
          activeSessions={activeSessions}
        />
      }
      {activeTab === 'computers' && 
        <ComputerManagement 
          computers={computers} 
          addComputer={addComputer} 
          editComputer={editComputer} 
          deleteComputer={deleteComputer} 
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'sessions' && 
        <SessionManagement 
          activeSessions={activeSessions} 
          computers={computers} 
          timePackages={timePackages} 
          customers={customers} 
          startSession={startSession} 
          endSession={endSession} 
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'customers' && 
        <CustomerManagement 
          customers={customers} 
          addCustomer={addCustomer} 
          editCustomer={editCustomer} 
          deleteCustomer={deleteCustomer} 
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'kitchen' && 
        <KitchenManagement 
          menu={menu}
          stock={stock}
          orders={orders} 
          updateOrderStatus={updateOrderStatus}
          setOrders={updateOrderStatus}
          setStock={editStock}
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'attendance' && isAdmin && 
        <AttendanceManagement 
          staff={staff}
          isAdmin={isAdmin}
        />
      }
      {activeTab === 'settings' && isAdmin && (
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
                  isAdmin={isAdmin}
                />
              )}
              
              {settingsTab === 'audit' && (
                <AuditLogs 
                  auditLogs={auditLogs}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TabContent;