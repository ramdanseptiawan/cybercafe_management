import React from 'react';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';

// Helper function to format currency in Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TransactionsView = ({ transactions, setShowTransactionModal, isAdmin }) => {
  // Calculate totals
  const totalSales = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.price, 0);
  const totalPurchases = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.price, 0);
  const netBalance = totalSales - totalPurchases;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
        {isAdmin && (
          <button
            onClick={() => setShowTransactionModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-green-800">
                {formatRupiah(totalSales)}
              </p>
            </div>
            <ArrowUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Total Purchases</p>
              <p className="text-2xl font-bold text-red-800">
                {formatRupiah(totalPurchases)}
              </p>
            </div>
            <ArrowDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-800">{transactions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Net Balance</p>
              <p className="text-2xl font-bold text-purple-800">
                {formatRupiah(netBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="border-b">
                <td className="px-6 py-4">{transaction.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                  </span>
                </td>
                <td className="px-6 py-4">{transaction.item}</td>
                <td className="px-6 py-4">{transaction.quantity}</td>
                <td className="px-6 py-4">
                  <span className={transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.type === 'sale' ? '+' : '-'}{formatRupiah(transaction.price)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {transaction.type === 'sale' 
                    ? transaction.customer && `Customer: ${transaction.customer}`
                    : transaction.supplier && `Supplier: ${transaction.supplier}`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsView;