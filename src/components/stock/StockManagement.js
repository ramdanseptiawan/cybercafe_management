import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Helper function to format currency in Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StockManagement = ({ stock, editStock, deleteStock, setShowStockModal, isAdmin }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stock Management</h2>
        {isAdmin && (
          <button
            onClick={() => setShowStockModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Stock
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {stock.map(item => (
              <tr key={item.id} className="border-b">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </td>
                <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                <td className="px-6 py-4">{formatRupiah(item.price)}</td>
                <td className="px-6 py-4">{formatRupiah(item.quantity * item.price)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.quantity <= item.minLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.quantity <= item.minLevel ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editStock(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStock(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockManagement;