import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, User, Shield, Settings, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useStaffData } from '../../hooks/useStaffData';

const StaffManagement = () => {
  const {
    staff,
    roles,
    loading,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    addRole,
    updateRole,
    deleteRole
  } = useStaffData();

  const [activeTab, setActiveTab] = useState('staff');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Tambahkan state untuk toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Update form structure to match backend User model
  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    ktp_number: '',
    employee_id: '',
    role_id: '',
    is_active: true
  });

  // Tambahkan function showToast (HAPUS DUPLIKAT)
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
  };
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: '[]' // JSON string as per backend model
  });

  // HAPUS FUNCTION showToast YANG KEDUA (line 58-63)
  // const showToast = (message, type = 'success') => {
  //   setToast({ show: true, message, type });
  //   setTimeout(() => {
  //     setToast({ show: false, message: '', type: 'success' });
  //   }, 3000);
  // };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingStaff) {
        const result = await updateStaff(editingStaff.id, staffForm);
        if (result.success) {
          showToast('Staff member updated successfully!', 'success');
          resetStaffForm();
        } else {
          showToast(result.message || 'Failed to update staff member', 'error');
        }
      } else {
        const result = await addStaff(staffForm);
        if (result.success) {
          showToast('Staff member added successfully!', 'success');
          resetStaffForm();
        } else {
          showToast(result.message || 'Failed to add staff member', 'error');
        }
      }
    } catch (error) {
      console.error('Error submitting staff:', error);
      showToast('An error occurred while saving staff member', 'error');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        const result = await updateRole(editingRole.id, roleForm);
        if (result.success) {
          showToast('Role updated successfully!', 'success');
          resetRoleForm();
        } else {
          showToast(result.message || 'Failed to update role', 'error');
        }
      } else {
        const result = await addRole(roleForm);
        if (result.success) {
          showToast('Role added successfully!', 'success');
          resetRoleForm();
        } else {
          showToast(result.message || 'Failed to add role', 'error');
        }
      }
    } catch (error) {
      console.error('Error submitting role:', error);
      showToast('An error occurred while saving role', 'error');
    }
  };

  const resetStaffForm = () => {
    setStaffForm({
      username: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      address: '',
      ktp_number: '',
      employee_id: '',
      role_id: '',
      is_active: true
    });
    setEditingStaff(null);
    setShowStaffModal(false);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: '[]'
    });
    setEditingRole(null);
    setShowRoleModal(false);
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      username: staff.username || '',
      email: staff.email || '',
      password: '', // Don't populate password for security
      name: staff.name || '',
      phone: staff.phone || '',
      address: staff.address || '',
      ktp_number: staff.ktp_number || '',
      employee_id: staff.employee_id || '',
      role_id: staff.role?.id || '', // Ubah dari staff.role_id ke staff.role?.id
      is_active: staff.is_active !== undefined ? staff.is_active : true
    });
    setShowStaffModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || '[]'
    });
    setShowRoleModal(true);
  };

  const handleDeleteStaff = async (member) => {
    if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      try {
        const result = await deleteStaff(member.id);
        if (!result.success) {
          alert(result.message || 'Failed to delete staff member');
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('An error occurred while deleting staff member');
      }
    }
  };

  const handleDeleteRole = async (role) => {
    if (window.confirm(`Are you sure you want to delete role ${role.name}?`)) {
      try {
        const result = await deleteRole(role.id);
        if (!result.success) {
          alert(result.message || 'Failed to delete role');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        alert('An error occurred while deleting role');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading staff data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">
          <p>Error loading staff data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'staff'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="inline-block w-4 h-4 mr-2" />
            Staff Members
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline-block w-4 h-4 mr-2" />
            Roles
          </button>
        </nav>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Staff Members</h3>
            <button
              onClick={() => setShowStaffModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </button>
          </div>

          {/* Staff Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {(staff || []).filter(member => member && member.id).map((member) => (
                <li key={member.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member?.email || ''} • {member?.username || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          Role: {member?.role?.name || 'Unknown'}
                        </div>
                        {(member?.ktp_number || member?.employee_id) && (
                          <div className="text-sm text-gray-500">
                            {member?.ktp_number && `KTP: ${member.ktp_number}`}
                            {member?.ktp_number && member?.employee_id && ' • '}
                            {member?.employee_id && `ID: ${member.employee_id}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member?.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleViewStaff(member)}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(member)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {(staff || []).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No staff members found. Add your first staff member to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Roles</h3>
            <button
              onClick={() => setShowRoleModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </button>
          </div>

          {/* Roles Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {(roles || []).filter(role => role && role.id).map((role) => (
                <li key={role.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Shield className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {role.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {role.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {(roles || []).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No roles found. Add your first role to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({...staffForm, username: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={editingStaff ? "Leave blank to keep current password" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={staffForm.address}
                    onChange={(e) => setStaffForm({...staffForm, address: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">KTP Number</label>
                  <input
                    type="text"
                    value={staffForm.ktp_number}
                    onChange={(e) => setStaffForm({...staffForm, ktp_number: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter KTP number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={staffForm.employee_id}
                    onChange={(e) => setStaffForm({...staffForm, employee_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    required
                    value={staffForm.role_id}
                    onChange={(e) => setStaffForm({...staffForm, role_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role</option>
                    {(roles || []).filter(role => role && role.id).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={staffForm.is_active}
                    onChange={(e) => setStaffForm({...staffForm, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetStaffForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingStaff ? 'Update' : 'Add'} Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h3>
              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Permissions (JSON)</label>
                  <textarea
                    value={roleForm.permissions}
                    onChange={(e) => setRoleForm({...roleForm, permissions: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder='["read", "write", "delete"]'
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetRoleForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingRole ? 'Update' : 'Add'} Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Staff Detail Modal */}
      {showDetailModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Staff Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-12 w-12 text-gray-400 bg-gray-100 rounded-full p-2" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedStaff.name}</h4>
                    <p className="text-sm text-gray-500">@{selectedStaff.username}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedStaff.email || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedStaff.phone || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900">{selectedStaff.address || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">KTP Number</label>
                    <p className="text-sm text-gray-900">{selectedStaff.ktp_number || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="text-sm text-gray-900">{selectedStaff.employee_id || '-'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-600">{selectedStaff.role?.name || 'Unknown'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedStaff.role?.description || ''}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedStaff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedStaff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {selectedStaff.role?.permissions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permissions</label>
                      <div className="mt-1">
                        {JSON.parse(selectedStaff.role.permissions).map((permission, index) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditStaff(selectedStaff);
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Staff
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
            {/* Toast Notification */}
            {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  toast.type === 'success'
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
