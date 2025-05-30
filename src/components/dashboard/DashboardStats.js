import React from 'react';
import { TrendingUp, TrendingDown, Users, Monitor, Coffee, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const DashboardStats = ({ computers, activeSessions, customers, orders, stock, transactions }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate computer usage percentage
  const computerUsage = computers ? 
    Math.round((computers.filter(c => c.status === 'in-use').length / computers.length) * 100) : 0;

  // Calculate low stock items
  const lowStockItems = stock ? 
    stock.filter(item => item.quantity <= item.minLevel) : [];

  // Calculate today's revenue
  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = transactions ? 
    transactions
      .filter(t => t.type === 'sale' && t.date === today)
      .reduce((sum, t) => sum + t.price, 0) : 0;

  // Calculate pending orders
  const pendingOrders = orders ? 
    orders.filter(order => order.status === 'pending' || order.status === 'preparing').length : 0;

  // Calculate active customers (customers with active sessions)
  const activeCustomers = activeSessions ? activeSessions.length : 0;

  // Calculate total customers
  const totalCustomers = customers ? customers.length : 0;

  // Calculate revenue trend (comparing today with yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const yesterdayRevenue = transactions ? 
    transactions
      .filter(t => t.type === 'sale' && t.date === yesterdayStr)
      .reduce((sum, t) => sum + t.price, 0) : 0;
  
  const revenueTrend = yesterdayRevenue === 0 ? 100 : 
    Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Computer Usage */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600">Computer Usage</p>
            <div className="flex items-end mt-1">
              <p className="text-2xl font-bold text-gray-900">{computerUsage}%</p>
              <p className="text-sm text-gray-600 ml-2 mb-1">of capacity</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Monitor className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${computerUsage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{computers ? computers.filter(c => c.status === 'in-use').length : 0} in use</span>
            <span>{computers ? computers.filter(c => c.status === 'available').length : 0} available</span>
          </div>
        </div>
      </div>

      {/* Today's Revenue */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
            <div className="flex items-end mt-1">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          {revenueTrend > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500 text-sm font-medium">{revenueTrend}%</span>
            </>
          ) : revenueTrend < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-500 text-sm font-medium">{Math.abs(revenueTrend)}%</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm font-medium">No change</span>
          )}
          <span className="text-gray-500 text-sm ml-1">vs yesterday</span>
        </div>
      </div>

      {/* Active Customers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Customers</p>
            <div className="flex items-end mt-1">
              <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
              <p className="text-sm text-gray-600 ml-2 mb-1">of {totalCustomers}</p>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full" 
              style={{ width: `${totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{activeCustomers} active now</span>
            <span>{totalCustomers} total registered</span>
          </div>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending Orders</p>
            <div className="flex items-end mt-1">
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
              <p className="text-sm text-gray-600 ml-2 mb-1">orders</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <Coffee className="w-6 h-6 text-amber-500" />
          </div>
        </div>
        <div className="mt-4">
          {pendingOrders > 0 ? (
            <div className="flex items-center text-amber-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Requires attention</span>
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <Check className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">All orders fulfilled</span>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alert</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{lowStockItems.length} items need restocking</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockItems.slice(0, 4).map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{item.minLevel} {item.unit}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lowStockItems.length > 4 && (
            <div className="mt-3 text-sm text-gray-500 text-center">
              And {lowStockItems.length - 4} more items...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardStats;