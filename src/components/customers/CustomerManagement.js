import React, { useState } from 'react';
import { User, Users, Search, Filter, Plus, Edit, Trash2, Star, Mail, Phone, Calendar, Clock, DollarSign, Tag } from 'lucide-react';

const CustomerManagement = ({ customers, setCustomers, isAdmin }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMembership, setFilterMembership] = useState('all');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: 'regular',
    joinDate: new Date().toISOString().split('T')[0],
    points: 0,
    visits: 0,
    totalSpent: 0,
    notes: '',
    preferredGames: []
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle adding a new customer
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      membershipType: 'regular',
      joinDate: new Date().toISOString().split('T')[0],
      points: 0,
      visits: 0,
      totalSpent: 0,
      notes: '',
      preferredGames: []
    });
    setShowAddModal(true);
  };

  // Handle editing a customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm(customer);
    setShowAddModal(true);
  };

  // Handle deleting a customer
  const handleDeleteCustomer = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(customer => customer.id !== id));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(customers.map(customer => 
        customer.id === editingCustomer.id ? { ...customerForm, id: editingCustomer.id } : customer
      ));
    } else {
      setCustomers([...customers, { ...customerForm, id: Date.now() }]);
    }
    setShowAddModal(false);
  };

  // Handle adding preferred games
  const handleAddGame = () => {
    const gameInput = document.getElementById('gameInput');
    if (gameInput.value.trim()) {
      setCustomerForm({
        ...customerForm,
        preferredGames: [...customerForm.preferredGames, gameInput.value.trim()]
      });
      gameInput.value = '';
    }
  };

  // Handle removing preferred games
  const handleRemoveGame = (game) => {
    setCustomerForm({
      ...customerForm,
      preferredGames: customerForm.preferredGames.filter(g => g !== game)
    });
  };

  // Filter customers based on search and membership type
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    if (filterMembership === 'all') return matchesSearch;
    return matchesSearch && customer.membershipType === filterMembership;
  });

  // Get membership badge color
  const getMembershipColor = (type) => {
    switch (type) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={handleAddCustomer}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg"
          />
        </div>
        <div className="sm:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterMembership}
              onChange={(e) => setFilterMembership(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg appearance-none"
            >
              <option value="all">All Members</option>
              <option value="regular">Regular</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{customer.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMembershipColor(customer.membershipType)}`}>
                  {customer.membershipType.toUpperCase()}
                </span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Join Date</p>
                    <p className="text-sm text-gray-600">{customer.joinDate}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Points</p>
                    <p className="text-lg font-semibold text-blue-600">{customer.points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Visits</p>
                    <p className="text-lg font-semibold text-blue-600">{customer.visits}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Spent</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>
                
                {customer.preferredGames && customer.preferredGames.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preferred Games</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.preferredGames.map((game, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {game}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button 
                  onClick={() => handleEditCustomer(customer)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Customers Found</h3>
          <p className="text-gray-500">There are no customers matching your search criteria.</p>
          <button 
            onClick={handleAddCustomer}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Customer
          </button>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                <select
                  value={customerForm.membershipType}
                  onChange={(e) => setCustomerForm({...customerForm, membershipType: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="regular">Regular</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input
                  type="date"
                  value={customerForm.joinDate}
                  onChange={(e) => setCustomerForm({...customerForm, joinDate: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    value={customerForm.points}
                    onChange={(e) => setCustomerForm({...customerForm, points: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visits</label>
                  <input
                    type="number"
                    value={customerForm.visits}
                    onChange={(e) => setCustomerForm({...customerForm, visits: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Spent</label>
                  <input
                    type="number"
                    value={customerForm.totalSpent}
                    onChange={(e) => setCustomerForm({...customerForm, totalSpent: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Games</label>
                <div className="flex mb-2">
                  <input
                    id="gameInput"
                    type="text"
                    className="flex-grow p-2 border rounded-l-lg"
                    placeholder="Add a game"
                  />
                  <button
                    type="button"
                    onClick={handleAddGame}
                    className="bg-blue-600 text-white px-3 py-2 rounded-r-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customerForm.preferredGames.map((game, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-800">{game}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGame(game)}
                        className="ml-1 text-gray-500 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;