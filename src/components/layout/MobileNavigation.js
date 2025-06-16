import { Coffee, Users, LogOut, Monitor, Settings, Menu as MenuIcon, Package, ShoppingCart, FileText, DollarSign, TrendingUp, Clipboard, Eye } from 'lucide-react';

const MobileNavigation = ({ mobileMenuOpen, setMobileMenuOpen, activeTab, setActiveTab, user, logout, isAdmin }) => {
  const userRole = user?.role?.name; // Mengambil nama role dari object role
  
  // Define menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, roles: ['admin', 'employee', 'viewer'] }
    ];
    
    const adminItems = [
      { id: 'computers', label: 'PC', icon: Monitor, roles: ['admin'] },
      { id: 'customers', label: 'Customer', icon: Users, roles: ['admin'] },
      { id: 'menu', label: 'Menu', icon: Coffee, roles: ['admin'] },
      { id: 'stock', label: 'Stock', icon: Package, roles: ['admin'] },
      { id: 'kitchen', label: 'Kitchen', icon: ShoppingCart, roles: ['admin'] },
      { id: 'transactions', label: 'Finance', icon: DollarSign, roles: ['admin'] },
      { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin'] },
      { id: 'attendance', label: 'Attendance', icon: Clipboard, roles: ['admin'] },

      { id: 'management-allowance-meal', label: 'Management Allowance Meal', icon: Eye, roles: ['admin'] },
      { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] }
    ];
    
    const employeeItems = [
      { id: 'individual-attendance', label: 'My Attendance', icon: Clipboard, roles: ['employee'] },
      { id: 'meal-allowance', label: 'Meal Allowance', icon: DollarSign, roles: ['employee'] },
      { id: 'kitchen', label: 'Kitchen', icon: ShoppingCart, roles: ['employee'] }
    ];
    
    const viewerItems = [
      { id: 'computers', label: 'PC', icon: Monitor, roles: ['viewer'] },
      { id: 'customers', label: 'Customer', icon: Users, roles: ['viewer'] },
      { id: 'reports', label: 'Reports', icon: FileText, roles: ['viewer'] }
    ];
    
    return [...baseItems, ...adminItems, ...employeeItems, ...viewerItems]
      .filter(item => item.roles.includes(userRole));
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-50 hover:bg-blue-700 transition-colors"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 max-h-96 overflow-y-auto">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            {/* User Info Section */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{user?.name?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role?.name || 'Staff Member'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
            
            {/* Navigation Grid */}
            <div className="grid grid-cols-3 gap-4">
              {getMenuItems().map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center p-4 rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Logout Button di Bagian Bawah Menu */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavigation;