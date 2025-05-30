import React, { useState } from 'react';
import { Plus, Edit, Trash2, Check, X, User, Shield } from 'lucide-react';

const StaffManagement = ({ staff, roles, addStaff, updateStaff, deleteStaff, addRole, updateRole, deleteRole, logAction }) => {
  const [activeTab, setActiveTab] = useState('staff');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [staffForm, setStaffForm] = useState({
    username: '',
    password: '',
    name: '',
    role: '',
    email: '',
    phone: '',
    active: true
  });
  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: []
  });

  // Available permissions
  const availablePermissions = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'stock', name: 'Stock Management' },
    { id: 'menu', name: 'Menu Management' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'reports', name: 'Reports' },
    { id: 'computers', name: 'Computer Management' },
    { id: 'sessions', name: 'Session Management' },
    { id: 'customers', name: 'Customer Management' },
    { id: 'kitchen', name: 'Kitchen Management' },
    { id: 'settings', name: 'Settings' },
    { id: 'all', name: 'All Permissions' }
  ];

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (editingStaff) {
      updateStaff({ ...staffForm, id: editingStaff.id });
    } else {
      addStaff(staffForm);
    }
    setShowStaffModal(false);
    setStaffForm({
      username: '',
      password: '',
      name: '',
      role: '',
      email: '',
      phone: '',
      active: true
    });
    setEditingStaff(null);
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    if (editingRole) {
      updateRole({ ...roleForm, id: editingRole.id });
    } else {
      addRole(roleForm);
    }
    setShowRoleModal(false);
    setRoleForm({
      name: '',
      permissions: []
    });
    setEditingRole(null);
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      username: staff.username,
      password: '', // Don't populate password for security
      name: staff.name,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      active: staff.active
    });
    setShowStaffModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      permissions: role.permissions
    });
    setShowRoleModal(true);
  };

  const handleDeleteStaff = (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id);
    }
  };

  const handleDeleteRole = (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRole(id);
    }
  };

  const handlePermissionChange = (permissionId) => {
    if (permissionId === 'all') {
      // If "All Permissions" is selected, toggle between all or none
      if (roleForm.permissions.includes('all')) {
        setRoleForm({ ...roleForm, permissions: [] });
      } else {
        setRoleForm({ ...roleForm, permissions: ['all'] });
      }
    } else {
      // If "All Permissions" was previously selected, remove it
      let updatedPermissions = roleForm.permissions.filter(p => p !== 'all');
      
      // Toggle the selected permission
      if (updatedPermissions.includes(permissionId)) {
        updatedPermissions = updatedPermissions.filter(p => p !== permissionId);
      } else {
        updatedPermissions.push(permissionId);
      }
      
      setRoleForm({ ...roleForm, permissions: updatedPermissions });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">User & Role Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              activeTab === 'staff'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              activeTab === 'roles'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Roles
          </button>
        </div>
      </div>

      {activeTab === 'staff' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-700">Staff Members</h3>
            <button
              onClick={() => {
                setEditingStaff(null);
                setStaffForm({
                  username: '',
                  password: '',
                  name: '',
                  role: '',
                  email: '',
                  phone: '',
                  active: true
                });
                setShowStaffModal(true);
              }}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Staff
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((staffMember) => (
                  <tr key={staffMember.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {roles.find(r => r.id === staffMember.role)?.name || staffMember.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        staffMember.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staffMember.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-700">User Roles</h3>
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleForm({
                  name: '',
                  permissions: []
                });
                setShowRoleModal(true);
              }}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Role
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.includes('all') ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            All Permissions
                          </span>
                        ) : (
                          role.permissions.map(permission => (
                            <span key={permission} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {availablePermissions.find(p => p.id === permission)?.name || permission}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={role.id === 'admin'} // Prevent deleting admin role
                      >
                        <Trash2 className={`h-4 w-4 ${role.id === 'admin' ? 'opacity-30' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingStaff ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required={!editingStaff}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={staffForm.active}
                  onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStaff ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h3>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permission-${permission.id}`}
                        checked={
                          roleForm.permissions.includes(permission.id) ||
                          (permission.id !== 'all' && roleForm.permissions.includes('all'))
                        }
                        onChange={() => handlePermissionChange(permission.id)}
                        disabled={permission.id !== 'all' && roleForm.permissions.includes('all')}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor={`permission-${permission.id}`} className="ml-2 text-sm text-gray-700">
                        {permission.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRole ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;