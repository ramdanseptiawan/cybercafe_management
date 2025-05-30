import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Monitor, Wifi, HardDrive, RefreshCw } from 'lucide-react';

const ComputerManagement = ({ computers, setComputers, isAdmin }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingComputer, setEditingComputer] = useState(null);
  const [computerForm, setComputerForm] = useState({
    name: '',
    status: 'available',
    specs: '',
    lastMaintenance: '',
    ipAddress: '',
    macAddress: '',
    location: 'Main Area'
  });

  const handleAddComputer = () => {
    setEditingComputer(null);
    setComputerForm({
      name: '',
      status: 'available',
      specs: '',
      lastMaintenance: new Date().toISOString().split('T')[0],
      ipAddress: '',
      macAddress: '',
      location: 'Main Area'
    });
    setShowAddModal(true);
  };

  const handleEditComputer = (computer) => {
    setEditingComputer(computer);
    setComputerForm(computer);
    setShowAddModal(true);
  };

  const handleDeleteComputer = (id) => {
    if (window.confirm('Are you sure you want to delete this computer?')) {
      setComputers(computers.filter(computer => computer.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingComputer) {
      setComputers(computers.map(computer => 
        computer.id === editingComputer.id ? { ...computerForm, id: editingComputer.id } : computer
      ));
    } else {
      setComputers([...computers, { ...computerForm, id: Date.now() }]);
    }
    setShowAddModal(false);
  };

  const handleStatusChange = (id, newStatus) => {
    setComputers(computers.map(computer => 
      computer.id === id ? { ...computer, status: newStatus } : computer
    ));
  };

  const handleMaintenanceUpdate = (id) => {
    setComputers(computers.map(computer => 
      computer.id === id ? { ...computer, lastMaintenance: new Date().toISOString().split('T')[0] } : computer
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {isAdmin && (
          <button 
            onClick={handleAddComputer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Computer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {computers.map(computer => (
          <div key={computer.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className={`p-4 ${
              computer.status === 'available' ? 'bg-green-50 border-b border-green-100' : 
              computer.status === 'in-use' ? 'bg-blue-50 border-b border-blue-100' : 
              'bg-red-50 border-b border-red-100'
            }`}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{computer.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                  ${computer.status === 'available' ? 'bg-green-100 text-green-800' : 
                    computer.status === 'in-use' ? 'bg-blue-100 text-blue-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {computer.status}
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-start">
                <Monitor className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Specifications</p>
                  <p className="text-sm text-gray-600">{computer.specs}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Maintenance</p>
                  <p className="text-sm text-gray-600">{computer.lastMaintenance}</p>
                </div>
              </div>
              
              {computer.ipAddress && (
                <div className="flex items-start">
                  <Wifi className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">IP Address</p>
                    <p className="text-sm text-gray-600">{computer.ipAddress}</p>
                  </div>
                </div>
              )}
              
              {computer.location && (
                <div className="flex items-start">
                  <HardDrive className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-sm text-gray-600">{computer.location}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
              {isAdmin ? (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditComputer(computer)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteComputer(computer.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              ) : (
                <div></div>
              )}
              
              <div className="flex space-x-2">
                {computer.status === 'available' && (
                  <button 
                    onClick={() => handleStatusChange(computer.id, 'in-use')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Start Session
                  </button>
                )}
                {computer.status === 'in-use' && (
                  <button 
                    onClick={() => handleStatusChange(computer.id, 'available')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    End Session
                  </button>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => handleMaintenanceUpdate(computer.id)}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" />
                    Update
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Computer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingComputer ? 'Edit Computer' : 'Add New Computer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Computer Name</label>
                <input
                  type="text"
                  value={computerForm.name}
                  onChange={(e) => setComputerForm({...computerForm, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={computerForm.status}
                  onChange={(e) => setComputerForm({...computerForm, status: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                <textarea
                  value={computerForm.specs}
                  onChange={(e) => setComputerForm({...computerForm, specs: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
                <input
                  type="date"
                  value={computerForm.lastMaintenance}
                  onChange={(e) => setComputerForm({...computerForm, lastMaintenance: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={computerForm.ipAddress}
                  onChange={(e) => setComputerForm({...computerForm, ipAddress: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
                <input
                  type="text"
                  value={computerForm.macAddress}
                  onChange={(e) => setComputerForm({...computerForm, macAddress: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={computerForm.location}
                  onChange={(e) => setComputerForm({...computerForm, location: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="Main Area">Main Area</option>
                  <option value="VIP Room">VIP Room</option>
                  <option value="Gaming Zone">Gaming Zone</option>
                  <option value="Quiet Zone">Quiet Zone</option>
                </select>
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
                  {editingComputer ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputerManagement;