import React from 'react';
import { ChevronLeft, Bell, Search } from 'lucide-react';

const Header = ({ activeTab, sidebarCollapsed, setSidebarCollapsed }) => {
  // Function to format the active tab name for display
  const formatTabName = (tabName) => {
    return tabName.charAt(0).toUpperCase() + tabName.slice(1);
  };

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4 h-16">
      <div className="flex items-center">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-800">{formatTabName(activeTab)}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="relative">
          <button className="text-gray-500 hover:text-gray-700 relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1 -translate-y-1"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;