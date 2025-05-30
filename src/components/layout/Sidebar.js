import React from 'react';
import { Coffee, Users, LogOut, Monitor, Clock, Settings, Menu as MenuIcon, Package, ShoppingCart, FileText, DollarSign, TrendingUp, UserPlus, Clipboard } from 'lucide-react';

const Sidebar = ({ user, logout, isAdmin, activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-800 text-white h-full flex-shrink-0 flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <Coffee className="w-8 h-8 text-blue-400 mr-3" />
          {!sidebarCollapsed && <h1 className="text-xl font-bold">CyberCafe</h1>}
        </div>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Main
        </div>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Dashboard"
        >
          <TrendingUp className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Dashboard</span>}
        </button>
        
        <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Computer Management
        </div>
        <button 
          onClick={() => setActiveTab('computers')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'computers' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Computers"
        >
          <Monitor className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Computers</span>}
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'sessions' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Sessions"
        >
          <Clock className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Sessions</span>}
        </button>
        
        <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Customer Management
        </div>
        <button 
          onClick={() => setActiveTab('customers')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'customers' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Customers"
        >
          <Users className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Customers</span>}
        </button>
        
        <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Cafe Management
        </div>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'menu' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Menu"
        >
          <Coffee className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Menu</span>}
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'stock' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Stock"
        >
          <Package className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Stock</span>}
        </button>
        <button 
          onClick={() => setActiveTab('kitchen')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'kitchen' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Kitchen"
        >
          <ShoppingCart className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Kitchen</span>}
        </button>
        
        <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Finance
        </div>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'transactions' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Transactions"
        >
          <DollarSign className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Transactions</span>}
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Reports"
        >
          <FileText className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Reports</span>}
        </button>
        
        {/* Add new Staff Management section */}
        <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
          Staff Management
        </div>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
            activeTab === 'attendance' ? 'bg-gray-700' : 'hover:bg-gray-700'
          }`}
          title="Attendance"
        >
          <Clipboard className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Attendance</span>}
        </button>
        
        {/* Rest of the sidebar items */}
        
        {isAdmin && (
          <>
            <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
              Admin
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'settings' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </>
        )}
      </nav>
      
      <div className={`p-4 border-t border-gray-700 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        {sidebarCollapsed ? (
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Staff'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-700"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;