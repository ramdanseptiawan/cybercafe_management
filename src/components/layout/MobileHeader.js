import { LogOut } from 'lucide-react';

const MobileHeader = ({ user, logout, activeTab, isAdmin }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-800">CyberCafe</h1>
        <p className="text-sm text-gray-600 capitalize">
          {activeTab === 'dashboard' ? 'Dashboard' :
           activeTab === 'computers' ? 'Computer Management' :
           activeTab === 'customers' ? 'Customer Management' :
           activeTab === 'menu' ? 'Menu Management' :
           activeTab === 'stock' ? 'Stock Management' :
           activeTab === 'kitchen' ? 'Kitchen Management' :
           activeTab === 'transactions' ? 'Transactions' :
           activeTab === 'reports' ? 'Reports' :
           activeTab === 'attendance' ? 'Attendance' :
           activeTab === 'settings' ? 'Settings' : 'Dashboard'}
        </p>
      </div>
      
      {/* User Info & Logout */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">{isAdmin ? 'Admin' : 'Staff'}</p>
        </div>
        <button
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;