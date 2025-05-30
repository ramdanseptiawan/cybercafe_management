import React, { useState } from 'react';
import { Coffee, ShoppingBag, Clock, Check, X, AlertTriangle, Search, Filter, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const KitchenManagement = ({ menu, stock, orders, setOrders, setStock, isAdmin }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    customer: '',
    items: [],
    status: 'pending',
    notes: '',
    tableNumber: '',
    isDelivery: false
  });
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate order total
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  // Handle removing an item from the order
  const handleRemoveItem = (id) => {
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter(item => item.id !== id)
    });
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.tableNumber && order.tableNumber.toString().includes(searchTerm));
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && order.status === filterStatus;
  });

  // Tambahkan fungsi untuk memeriksa ketersediaan stok
  const checkStockAvailability = (menuItemId) => {
    // Dapatkan bahan-bahan yang diperlukan untuk menu ini
    const menuItem = menu.find(item => item.id === parseInt(menuItemId));
    const requiredIngredients = menuItem?.ingredients || [];
    
    // Periksa apakah semua bahan tersedia dalam stok yang cukup
    const unavailableIngredients = requiredIngredients.filter(ingredient => {
      const stockItem = stock.find(item => item.name === ingredient);
      return !stockItem || stockItem.quantity <= 0;
    });
    
    return {
      available: unavailableIngredients.length === 0,
      unavailableIngredients
    };
  };

  // Handle adding a new order
  const handleAddOrder = () => {
    setOrderForm({
      customer: '',
      items: [],
      status: 'pending',
      notes: '',
      tableNumber: '',
      isDelivery: false
    });
    setShowAddModal(true);
  };

  // Modifikasi fungsi handleAddItem untuk memeriksa stok
  const handleAddItem = () => {
    if (!selectedItem) return;
    
    // Periksa ketersediaan stok
    const { available, unavailableIngredients } = checkStockAvailability(selectedItem);
    
    if (!available) {
      alert(`Cannot add this item. The following ingredients are out of stock: ${unavailableIngredients.join(', ')}`);
      return;
    }
    
    const menuItem = menu.find(item => item.id === parseInt(selectedItem));
    
    // Periksa apakah item sudah ada di pesanan
    const existingItemIndex = orderForm.items.findIndex(item => item.id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // Update jumlah jika item sudah ada
      const updatedItems = [...orderForm.items];
      updatedItems[existingItemIndex].quantity += selectedQuantity;
      setOrderForm({...orderForm, items: updatedItems});
    } else {
      // Tambahkan item baru jika belum ada
      setOrderForm({
        ...orderForm, 
        items: [
          ...orderForm.items, 
          {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: selectedQuantity
          }
        ]
      });
    }
    
    setSelectedItem('');
    setSelectedQuantity(1);
  };
  
  // Tambahkan fungsi untuk mengurangi stok setelah pesanan dibuat
  const reduceStock = (items) => {
    if (!setStock) return; // Pastikan setStock tersedia
    
    // Buat salinan array stok untuk dimodifikasi
    let updatedStock = [...stock];
    
    // Untuk setiap item dalam pesanan
    items.forEach(orderItem => {
      // Temukan menu item untuk mendapatkan bahan-bahannya
      const menuItem = menu.find(item => item.id === orderItem.id);
      if (!menuItem) return;
      
      // Untuk setiap bahan, kurangi stok
      menuItem.ingredients.forEach(ingredient => {
        // Temukan bahan dalam stok
        const stockIndex = updatedStock.findIndex(item => item.name === ingredient);
        if (stockIndex >= 0) {
          // Kurangi jumlah stok (asumsikan 1 unit per item pesanan)
          updatedStock[stockIndex] = {
            ...updatedStock[stockIndex],
            quantity: Math.max(0, updatedStock[stockIndex].quantity - orderItem.quantity)
          };
        }
      });
    });
    
    // Update state stok
    setStock(updatedStock);
  };
  
  // Modifikasi fungsi handleSubmit untuk mengurangi stok
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Periksa ketersediaan stok untuk semua item
    let allItemsAvailable = true;
    const unavailableItems = [];
    
    orderForm.items.forEach(item => {
      const { available, unavailableIngredients } = checkStockAvailability(item.id);
      if (!available) {
        allItemsAvailable = false;
        unavailableItems.push({
          name: item.name,
          ingredients: unavailableIngredients
        });
      }
    });
    
    if (!allItemsAvailable) {
      const message = unavailableItems.map(item => 
        `${item.name} (missing: ${item.ingredients.join(', ')})`
      ).join('\n');
      
      alert(`Cannot create order. The following items have ingredients that are out of stock:\n${message}`);
      return;
    }
    
    // Buat pesanan baru
    const newOrder = {
      ...orderForm,
      id: Date.now(),
      status: 'pending',
      timestamp: new Date().toISOString(),
      total: calculateTotal(orderForm.items)
    };
    
    // Tambahkan pesanan ke daftar
    setOrders([...orders, newOrder]);
    
    // Kurangi stok
    reduceStock(orderForm.items);
    
    // Reset form
    setOrderForm({
      customer: '',
      tableNumber: '',
      isDelivery: false,
      items: [],
      notes: ''
    });
    
    // Tutup modal
    setShowAddModal(false);
  };
  
  // Tambahkan fungsi untuk memeriksa menu yang tidak tersedia
  const getUnavailableMenuItems = () => {
    return menu.filter(item => {
      const { available } = checkStockAvailability(item.id);
      return !available;
    });
  };
  
  // Dapatkan menu yang tersedia
  const availableMenuItems = menu.filter(item => {
    const { available } = checkStockAvailability(item.id);
    return item.available && available;
  });
  
  // Dapatkan menu yang tidak tersedia
  const unavailableMenuItems = getUnavailableMenuItems();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kitchen Management</h2>
        <button 
          onClick={handleAddOrder}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Order
        </button>
      </div>

      {/* Peringatan Menu Tidak Tersedia */}
      {unavailableMenuItems.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Menu Unavailable</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>The following menu items are unavailable due to out of stock ingredients:</p>
                <ul className="mt-1 list-disc list-inside">
                  {unavailableMenuItems.map(item => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer or table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>
        <div className="sm:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg appearance-none"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center">
                  <div className="mr-4">
                    {order.status === 'pending' && <Clock className="w-6 h-6 text-yellow-500" />}
                    {order.status === 'preparing' && <Coffee className="w-6 h-6 text-blue-500" />}
                    {order.status === 'ready' && <Check className="w-6 h-6 text-purple-500" />}
                    {order.status === 'completed' && <Check className="w-6 h-6 text-green-500" />}
                    {order.status === 'cancelled' && <X className="w-6 h-6 text-red-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {order.isDelivery ? 'Delivery' : `Table ${order.tableNumber}`} - {order.customer}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatTime(order.timestamp)} • {order.items.length} items • {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full mr-3 ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                  {expandedOrder === order.id ? 
                    <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  }
                </div>
              </div>
              
              {expandedOrder === order.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3 space-y-3">
                    <h4 className="font-medium text-gray-700">Order Items</h4>
                    <ul className="divide-y divide-gray-100">
                      {order.items.map((item, index) => (
                        <li key={index} className="py-2 flex justify-between">
                          <div>
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                          </div>
                          <div className="text-gray-700">{formatCurrency(item.price * item.quantity)}</div>
                        </li>
                      ))}
                    </ul>
                    
                    {order.notes && (
                      <div className="pt-2">
                        <h4 className="font-medium text-gray-700">Notes</h4>
                        <p className="text-gray-600 mt-1">{order.notes}</p>
                      </div>
                    )}
                    
                    <div className="pt-2 flex justify-between items-center">
                      <div className="font-medium">Total</div>
                      <div className="text-lg font-semibold">{formatCurrency(order.total)}</div>
                    </div>
                    
                    <div className="pt-3 flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(order.id, 'preparing')}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Start Preparing
                          </button>
                          <button 
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'ready')}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          Mark as Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button 
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-gray-500">There are no orders matching your search criteria.</p>
          <button 
            onClick={handleAddOrder}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Order
          </button>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={orderForm.customer}
                    onChange={(e) => setOrderForm({...orderForm, customer: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                  <input
                    type="number"
                    value={orderForm.tableNumber}
                    onChange={(e) => setOrderForm({...orderForm, tableNumber: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    disabled={orderForm.isDelivery}
                    required={!orderForm.isDelivery}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDelivery"
                  checked={orderForm.isDelivery}
                  onChange={(e) => setOrderForm({...orderForm, isDelivery: e.target.checked, tableNumber: e.target.checked ? '' : orderForm.tableNumber})}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="isDelivery" className="ml-2 text-sm text-gray-700">
                  This is a delivery order
                </label>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-700 mb-2">Add Items</h4>
                <div className="flex mb-2">
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="flex-grow p-2 border rounded-l-lg"
                  >
                    <option value="">Select an item</option>
                    {availableMenuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {formatCurrency(item.price)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 p-2 border-t border-b border-r"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-green-600 text-white px-3 py-2 rounded-r-lg hover:bg-green-700"
                    disabled={!selectedItem}
                  >
                    Add
                  </button>
                </div>
                
                {orderForm.items.length > 0 ? (
                  <div className="mt-3 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderForm.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{item.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{item.quantity}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">{formatCurrency(item.price * item.quantity)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan="2" className="px-3 py-2 text-sm font-medium">Total</td>
                          <td colSpan="2" className="px-3 py-2 text-sm font-medium">
                            {formatCurrency(calculateTotal(orderForm.items))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    No items added yet
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                  placeholder="Special instructions, allergies, etc."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={orderForm.items.length === 0}
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenManagement;