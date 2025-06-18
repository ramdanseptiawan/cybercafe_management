import React from 'react';
import { Coffee, Users, LogOut, Monitor, Clock, Settings, Menu as MenuIcon, Package, ShoppingCart, FileText, DollarSign, TrendingUp, UserPlus, Clipboard, Eye } from 'lucide-react';

const Sidebar = ({ user, logout, isAdmin, activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed }) => {
  // Debug info
  console.log('Sidebar Debug:', { user, isAdmin, userRole: user?.role });
  
  const userRole = user?.role?.name; // Mengambil nama role dari object role
  
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
        {/* ADMIN ONLY MENUS */}
        {userRole === 'admin' && (
          <>
            {/* Staff Management */}
            <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
              Staff Management
            </div>
            <button 
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'attendance' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="Staff Attendance"
            >
              <Clipboard className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Staff Attendance</span>}
            </button>

            <button 
              onClick={() => setActiveTab('management-allowance-meal')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'management-allowance-meal' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="Management Allowance Meal"
            >
              <Eye className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Management Allowance Meal</span>}
            </button>

            <button 
              onClick={() => setActiveTab('attendance-history')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'attendance-history' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="Attendance History"
            >
              <Clock className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Attendance History</span>}
            </button>
            
            {/* Settings */}
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
        
        {/* VIEWER ONLY MENUS */}
        {userRole === 'viewer' && (
          <>
            {/* View Only Sections */}
            <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
              View Only
            </div>
            <button 
              onClick={() => setActiveTab('computers')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'computers' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="View Computers"
            >
              <Monitor className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>View Computers</span>}
            </button>
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'sessions' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="View Sessions"
            >
              <Clock className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>View Sessions</span>}
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="View Reports"
            >
              <Eye className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>View Reports</span>}
            </button>
            <button 
              onClick={() => setActiveTab('attendance-history')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'attendance-history' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="Attendance History"
            >
              <Clock className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Attendance History</span>}
            </button>
          </>
        )}
        
        {/* EMPLOYEE ONLY MENUS */}
        {userRole === 'employee' && (
          <>
            {/* My Attendance */}
            <div className={`px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${sidebarCollapsed ? 'sr-only' : ''}`}>
              My Attendance
            </div>
            <button 
              onClick={() => setActiveTab('individual-attendance')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'individual-attendance' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="My Attendance"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>My Attendance</span>}
            </button>
            <button 
              onClick={() => setActiveTab('meal-allowance')}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-4'} py-3 w-full text-left ${
                activeTab === 'meal-allowance' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              title="My Meal Allowance"
            >
              <DollarSign className="w-5 h-5 mr-3" />
              {!sidebarCollapsed && <span>Meal Allowance</span>}
            </button>
          </>
        )}
      </nav>
      
      {/* User Info & Logout */}
      <div className="border-t border-gray-700 p-4">
        {!sidebarCollapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.name}</p>
          </div>
        )}
        <button 
          onClick={logout}
          className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-2'} py-2 w-full text-left hover:bg-gray-700 rounded-md`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 mr-3" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;