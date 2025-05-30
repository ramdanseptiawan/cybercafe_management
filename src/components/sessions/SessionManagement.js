import React, { useState } from 'react';
import { Clock, User, Monitor, DollarSign, Plus, Search, Filter } from 'lucide-react';

const SessionManagement = ({ 
  activeSessions, 
  setActiveSessions, 
  computers, 
  setComputers, 
  timePackages 
}) => {
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sessionForm, setSessionForm] = useState({
    user: '',
    computer: '',
    package: '',
    duration: '',
    price: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  // Format time from 24h to 12h format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate time remaining
  const calculateTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date();
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    end.setHours(endHours, endMinutes, 0, 0);
    
    if (end < now) {
      end.setDate(end.getDate() + 1); // If end time is earlier today, it must be for tomorrow
    }
    
    const diffMs = end - now;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return `${hours}h ${mins}m`;
  };

  // Handle package selection
  const handlePackageSelect = (packageId) => {
    const selectedPackage = timePackages.find(pkg => pkg.id === parseInt(packageId));
    if (selectedPackage) {
      // Get current time
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const startTime = `${hours}:${minutes}`;
      
      // Calculate end time
      let endHours = now.getHours() + selectedPackage.duration;
      const endMinutes = now.getMinutes();
      
      // Handle day overflow
      if (endHours >= 24) {
        endHours = endHours - 24;
      }
      
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      setSessionForm({
        ...sessionForm,
        package: selectedPackage.id,
        packageName: selectedPackage.name,
        duration: selectedPackage.duration,
        price: selectedPackage.price,
        startTime: startTime,
        endTime: endTime
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create new session
    const newSession = {
      id: Date.now(),
      user: sessionForm.user,
      computer: sessionForm.computer,
      computerName: computers.find(c => c.id === parseInt(sessionForm.computer))?.name,
      package: sessionForm.package,
      packageName: sessionForm.packageName,
      duration: sessionForm.duration,
      price: sessionForm.price,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      notes: sessionForm.notes,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    // Add to active sessions
    setActiveSessions([...activeSessions, newSession]);
    
    // Update computer status
    setComputers(computers.map(computer => 
      computer.id === parseInt(sessionForm.computer) 
        ? { ...computer, status: 'in-use' }
        : computer
    ));
    
    // Reset form and close modal
    setSessionForm({
      user: '',
      computer: '',
      package: '',
      duration: '',
      price: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
    setShowAddSessionModal(false);
  };

  // Handle ending a session
  const handleEndSession = (sessionId) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (session) {
      // Update computer status
      setComputers(computers.map(computer => 
        computer.id === parseInt(session.computer) 
          ? { ...computer, status: 'available' }
          : computer
      ));
      
      // Remove from active sessions
      setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
    }
  };

  // Handle extending a session
  const handleExtendSession = (sessionId) => {
    // Implementation for extending a session would go here
    console.log("Extend session:", sessionId);
  };

  // Filter sessions based on search and filter
  const filteredSessions = activeSessions.filter(session => {
    const matchesSearch = 
      session.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.computerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && session.status === filterStatus;
  });

  // Get available computers for new sessions
  const availableComputers = computers.filter(computer => computer.status === 'available');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setShowAddSessionModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          disabled={availableComputers.length === 0}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Session
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by user or computer..."
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
              <option value="all">All Sessions</option>
              <option value="active">Active</option>
              <option value="ending">Ending Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map(session => (
            <div key={session.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{session.user}</h3>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                  {session.packageName}
                </span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-start">
                  <Monitor className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Computer</p>
                    <p className="text-sm text-gray-600">{session.computerName}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Time</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Price</p>
                    <p className="text-sm text-gray-600">{formatCurrency(session.price)}</p>
                  </div>
                </div>
                
                {session.notes && (
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-sm text-gray-600">{session.notes}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-700">Time Remaining:</p>
                    <p className="text-sm font-semibold text-purple-600">
                      {calculateTimeRemaining(session.endTime)}
                    </p>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button 
                  onClick={() => handleExtendSession(session.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Extend Time
                </button>
                <button 
                  onClick={() => handleEndSession(session.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  End Session
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Sessions</h3>
          <p className="text-gray-500">There are currently no active user sessions.</p>
          {availableComputers.length > 0 ? (
            <button 
              onClick={() => setShowAddSessionModal(true)}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Session
            </button>
          ) : (
            <p className="mt-4 text-amber-600">No computers available for new sessions.</p>
          )}
        </div>
      )}

      {/* Add Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Session</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={sessionForm.user}
                  onChange={(e) => setSessionForm({...sessionForm, user: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Computer</label>
                <select
                  value={sessionForm.computer}
                  onChange={(e) => setSessionForm({...sessionForm, computer: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select a computer</option>
                  {availableComputers.map(computer => (
                    <option key={computer.id} value={computer.id}>
                      {computer.name} - {computer.location}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Package</label>
                <select
                  value={sessionForm.package}
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select a package</option>
                  {timePackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.duration} hours - {formatCurrency(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>
              
              {sessionForm.startTime && sessionForm.endTime && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="text"
                      value={formatTime(sessionForm.startTime)}
                      className="w-full p-2 border rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="text"
                      value={formatTime(sessionForm.endTime)}
                      className="w-full p-2 border rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;