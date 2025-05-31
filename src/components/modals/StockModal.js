import React from 'react';

// Helper function to format currency in Rupiah (masking)
const formatRupiah = (amount) => {
  if (amount === '' || amount === null || amount === undefined) return '';
  return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper to parse formatted rupiah string to number
const parseRupiah = (str) => {
  if (!str) return '';
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || '';
};

const StockModal = ({ 
  editingItem, 
  stockForm, 
  setStockForm, 
  handleStockSubmit, 
  setShowStockModal, 
  setEditingItem 
}) => {
  // Live Rupiah masking for price input
  const handlePriceChange = (e) => {
    const raw = parseRupiah(e.target.value);
    setStockForm({ ...stockForm, price: raw });
  };

  // Perbaikan form handling
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi form
    if (!stockForm.name || !stockForm.quantity || !stockForm.unit || !stockForm.minLevel || !stockForm.price || !stockForm.category) {
      alert('Semua field harus diisi!');
      return;
    }
    
    // Validasi angka
    if (isNaN(stockForm.quantity) || isNaN(stockForm.minLevel) || isNaN(stockForm.price)) {
      alert('Quantity, Min Level, dan Price harus berupa angka!');
      return;
    }
    
    handleStockSubmit(e);
  };
  
  // Perbaikan input handling
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setStockForm({
      ...stockForm, 
      quantity: value === '' ? '' : parseFloat(value) || ''
    });
  };
  
  const handleMinLevelChange = (e) => {
    const value = e.target.value;
    setStockForm({
      ...stockForm, 
      minLevel: value === '' ? '' : parseFloat(value) || ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {editingItem ? 'Edit Stock Item' : 'Add Stock Item'}
        </h3>
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={stockForm.name || ''}
            onChange={(e) => setStockForm({...stockForm, name: e.target.value})}
            className="w-full p-3 border rounded-lg"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Quantity"
              value={stockForm.quantity || ''}
              onChange={(e) => setStockForm({...stockForm, quantity: e.target.value === '' ? '' : parseFloat(e.target.value)})}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Unit (kg, pcs, etc.)"
              value={stockForm.unit || ''}
              onChange={(e) => setStockForm({...stockForm, unit: e.target.value})}
              className="p-3 border rounded-lg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Min Level"
              value={stockForm.minLevel || ''}
              onChange={(e) => setStockForm({...stockForm, minLevel: e.target.value === '' ? '' : parseFloat(e.target.value)})}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Price (Rp)"
              value={stockForm.price === '' ? '' : formatRupiah(stockForm.price)}
              onChange={handlePriceChange}
              className="p-3 border rounded-lg"
              required
            />
          </div>
          <input
            type="text"
            placeholder="Category"
            value={stockForm.category || ''}
            onChange={(e) => setStockForm({...stockForm, category: e.target.value})}
            className="w-full p-3 border rounded-lg"
            required
          />
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowStockModal(false);
                setEditingItem(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;