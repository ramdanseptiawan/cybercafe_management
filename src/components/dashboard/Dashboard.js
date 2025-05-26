import React from 'react';
import { Plus, Package, DollarSign, AlertTriangle, Coffee } from 'lucide-react';

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
  setShowStockModal, 
  setShowMenuModal, 
  setShowTransactionModal,
  isAdmin 
}) => {
  const lowStockItems = stock.filter(item => item.quantity <= item.minLevel);
  const totalStockValue = stock.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const todayTransactions = transactions.filter(t => t.date === new Date().toISOString().split('T')[0]);
  const todayRevenue = todayTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Stock Value</p>
              <p className="text-2xl font-bold text-blue-800">{formatRupiah(totalStockValue)}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold text-green-800">{formatRupiah(todayRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-800">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
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

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Low Stock Alert
          </h3>
          <div className="space-y-1">
            {lowStockItems.map(item => (
              <p key={item.id} className="text-red-700 text-sm">
                {item.name}: {item.quantity} {item.unit} (Min: {item.minLevel})
              </p>
            ))}
          </div>
        </div>
      )}

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