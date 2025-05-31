import React, { useState, useEffect } from 'react';

// Helper function to format currency in Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to parse formatted rupiah string to number
const parseRupiah = (str) => {
  if (!str) return '';
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || '';
};

const TransactionModal = ({ 
  transactionForm, 
  setTransactionForm, 
  handleTransactionSubmit, 
  setShowTransactionModal,
  stock,
  menu
}) => {
  // State to track available items based on transaction type
  const [availableItems, setAvailableItems] = useState([]);

  // Update available items when transaction type changes
  useEffect(() => {
    if (transactionForm.type === 'purchase') {
      // For purchases, show stock items
      setAvailableItems(stock.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price
      })));
    } else {
      // For sales, show menu items
      setAvailableItems(menu.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price
      })));
    }
  }, [transactionForm.type, stock, menu]);

  // Handle item selection
  const handleItemSelect = (itemId) => {
    const selectedItem = availableItems.find(item => item.id === parseInt(itemId));
    if (selectedItem) {
      setTransactionForm({
        ...transactionForm,
        item: selectedItem.name,
        itemPrice: selectedItem.price,
        price: selectedItem.price * (transactionForm.quantity || 1)
      });
    }
  };

  // Update total price when quantity changes
  const handleQuantityChange = (quantity) => {
    const parsedQuantity = quantity === '' ? '' : parseInt(quantity, 10) || 0;
    setTransactionForm({
      ...transactionForm,
      quantity: parsedQuantity,
      price: parsedQuantity === '' ? '' : (transactionForm.itemPrice || 0) * parsedQuantity
    });
  };

  // Handle price input with live masking
  const handlePriceInput = (e) => {
    const raw = parseRupiah(e.target.value);
    setTransactionForm({
      ...transactionForm,
      price: raw
    });
  };

  // Handle price change with validation
  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Only update if it's a valid number or empty
    if (value === '' || !isNaN(parseFloat(value))) {
      setTransactionForm({...transactionForm, price: value === '' ? '' : parseFloat(value)});
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Transaction</h3>
        <form onSubmit={handleTransactionSubmit} className="space-y-4">
          <select
            value={transactionForm.type || 'purchase'}
            onChange={(e) => setTransactionForm({
              ...transactionForm, 
              type: e.target.value,
              item: '',
              quantity: '',
              price: '',
              supplier: '',
              customer: ''
            })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="purchase">Purchase Stock</option>
            <option value="sale">Sale Menu Item</option>
          </select>
          
          <select
            value={availableItems.find(item => item.name === transactionForm.item)?.id || ''}
            onChange={(e) => handleItemSelect(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">Select {transactionForm.type === 'purchase' ? 'Stock' : 'Menu'} Item</option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - {formatRupiah(item.price)}
              </option>
            ))}
          </select>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Quantity"
              value={transactionForm.quantity || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Total Price (Rp)"
              value={transactionForm.price === '' ? '' : formatRupiah(transactionForm.price)}
              onChange={handlePriceInput}
              className="p-3 border rounded-lg"
              required
            />
          </div>
          
          {transactionForm.type === 'purchase' ? (
            <input
              type="text"
              placeholder="Supplier"
              value={transactionForm.supplier || ''}
              onChange={(e) => setTransactionForm({...transactionForm, supplier: e.target.value})}
              className="w-full p-3 border rounded-lg"
            />
          ) : (
            <input
              type="text"
              placeholder="Customer/Table"
              value={transactionForm.customer || ''}
              onChange={(e) => setTransactionForm({...transactionForm, customer: e.target.value})}
              className="w-full p-3 border rounded-lg"
            />
          )}
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700"
            >
              Add Transaction
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTransactionModal(false);
                setTransactionForm({ type: 'purchase', item: '', quantity: '', price: '', supplier: '', customer: '' });
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

export default TransactionModal;

// Perbaikan form validation
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validasi form
  if (!transactionForm.item || !transactionForm.quantity || !transactionForm.price) {
    alert('Item, Quantity, dan Price harus diisi!');
    return;
  }
  
  // Validasi angka
  if (isNaN(transactionForm.quantity) || isNaN(transactionForm.price)) {
    alert('Quantity dan Price harus berupa angka!');
    return;
  }
  
  if (parseFloat(transactionForm.quantity) <= 0 || parseFloat(transactionForm.price) <= 0) {
    alert('Quantity dan Price harus lebih dari 0!');
    return;
  }
  
  handleTransactionSubmit(e);
};