import React from 'react';
import { Plus, Package, DollarSign, AlertTriangle, Coffee, Users, Monitor, Clock, TrendingUp, TrendingDown, Check } from 'lucide-react';

// Helper function to format currency in Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Dashboard = ({ 
  stock, 
  menu, 
  transactions, 
  computers,
  activeSessions,
  customers,
  orders,
  setShowStockModal, 
  setShowMenuModal, 
  setShowTransactionModal,
  isAdmin 
}) => {
  // Kalkulasi untuk statistik
  // Kalkulasi low stock
  const lowStockItems = stock.filter(item => item.quantity <= item.minLevel);
  const totalStockValue = stock.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  // Tanggal hari ini
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date === today);
  const todayRevenue = todayTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.price, 0);
  
  // Kalkulasi untuk computer usage
  const computerUsage = computers ? 
    Math.round((computers.filter(c => c.status === 'in-use').length / computers.length) * 100) : 0;
  
  // Kalkulasi untuk active customers
  const activeCustomers = activeSessions ? activeSessions.length : 0;
  const totalCustomers = customers ? customers.length : 0;
  
  // Kalkulasi untuk pending orders
  const pendingOrders = orders ? 
    orders.filter(order => order.status === 'pending' || order.status === 'preparing').length : 0;

  // Kalkulasi untuk revenue trend
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
    <div className="space-y-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Today Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Today&apos;s Revenue</p>
              <div className="flex items-end mt-1">
                <p className="text-2xl font-bold text-gray-900">{formatRupiah(todayRevenue)}</p>
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
      </div>

      {/* Second Row - Stock Value and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Stock Value and Menu Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Stock Value</p>
                <p className="text-2xl font-bold text-blue-800">{formatRupiah(totalStockValue)}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Menu Items</p>
                <p className="text-2xl font-bold text-purple-800">{menu.length}</p>
              </div>
              <Coffee className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
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

      {/* Third Row - Recent Transactions and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{transaction.item}</p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'sale' ? '+' : '-'}{formatRupiah(transaction.price)}
                  </p>
                  <p className="text-sm text-gray-600">{transaction.quantity} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowStockModal(true)}
                className="w-full p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Stock Item
              </button>
              <button
                onClick={() => setShowMenuModal(true)}
                className="w-full p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Menu Item
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="w-full p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Record Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;