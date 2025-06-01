import React from 'react';
import { Clock, Users, Monitor, ShoppingCart, Clipboard, CheckCircle, AlertCircle } from 'lucide-react';

const EmployeeDashboard = ({ 
  user,
  orders,
  activeSessions,
  computers,
  setActiveTab,
  todayAttendance
}) => {
  // Calculate stats based on user permissions
  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || user?.permissions?.includes('all');
  };

  const pendingOrders = orders?.filter(order => 
    order.status === 'pending' || order.status === 'preparing'
  ).length || 0;

  const activeCustomers = activeSessions?.length || 0;
  const computerUsage = computers ? 
    Math.round((computers.filter(c => c.status === 'in-use').length / computers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome Back, {user?.name}!</h1>
        <p className="text-blue-100">Department: {user?.department}</p>
        <p className="text-blue-100">Here's your daily overview</p>
      </div>

      {/* Quick Actions based on permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance - Always available */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Attendance</h3>
            <Clipboard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Today's Status:</span>
              <span className={`font-medium ${
                todayAttendance?.checkIn ? 'text-green-600' : 'text-red-600'
              }`}>
                {todayAttendance?.checkIn ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {todayAttendance?.checkIn && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check In:</span>
                <span className="font-medium">{todayAttendance.checkIn}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setActiveTab('individual-attendance')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Attendance
          </button>
        </div>

        {/* Kitchen Orders */}
        {hasPermission('kitchen') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Kitchen Orders</h3>
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending Orders:</span>
                <span className="font-medium text-orange-600">{pendingOrders}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('kitchen')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Kitchen
            </button>
          </div>
        )}

        {/* Computer Management */}
        {hasPermission('computers') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Computer Management</h3>
              <Monitor className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Usage:</span>
                <span className="font-medium text-purple-600">{computerUsage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Sessions:</span>
                <span className="font-medium">{activeCustomers}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('computers')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Computers
            </button>
          </div>
        )}

        {/* Stock Management */}
        {hasPermission('stock') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Stock Management</h3>
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-600 mb-4 text-sm">Manage inventory and stock levels</p>
            <button
              onClick={() => setActiveTab('stock')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Manage Stock
            </button>
          </div>
        )}

        {/* Customer Management */}
        {hasPermission('customers') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Customer Management</h3>
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-gray-600 mb-4 text-sm">Manage customer data and sessions</p>
            <button
              onClick={() => setActiveTab('customers')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Manage Customers
            </button>
          </div>
        )}
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">PC Usage</p>
              <p className="text-2xl font-bold text-gray-900">{computerUsage}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Monitor className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAttendance?.checkIn ? '✓' : '✗'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              todayAttendance?.checkIn ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {todayAttendance?.checkIn ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {orders?.slice(0, 5).map((order, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">{order.customer}</p>
                  <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">Rp {order.total?.toLocaleString()}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;