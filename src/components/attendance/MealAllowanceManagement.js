import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Eye, Edit3 } from 'lucide-react';
import { mealAllowanceService } from '../../services/mealAllowanceService';

const MealAllowanceManagement = ({ currentUser }) => {
  const [mealAllowances, setMealAllowances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });
  const [stats, setStats] = useState({
    total_claims: 0,
    pending_claims: 0,
    approved_claims: 0,
    rejected_claims: 0,
    paid_claims: 0,
    total_amount: 0,
    paid_amount: 0
  });

  // Fetch meal allowances
  const fetchMealAllowances = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      const params = { page, limit: pagination.limit };
      
      switch (selectedPeriod) {
        case 'month':
          params.month = (now.getMonth() + 1).toString();
          params.year = now.getFullYear().toString();
          break;
        case 'year':
          params.year = now.getFullYear().toString();
          break;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await mealAllowanceService.getAllMealAllowances(params);
      setMealAllowances(response.data || []);
      setPagination(response.pagination || pagination);
      
      // Fetch stats
      const statsResponse = await mealAllowanceService.getMealAllowanceStats({
        month: params.month,
        year: params.year
      });
      setStats(statsResponse.data || stats);
      
    } catch (err) {
      setError('Gagal memuat data uang makan');
      console.error('Error fetching meal allowances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update meal allowance status
  const handleUpdateStatus = async () => {
    if (!selectedAllowance || !updateStatus) return;
    
    try {
      setLoading(true);
      
      await mealAllowanceService.updateMealAllowanceStatus(selectedAllowance.id, {
        status: updateStatus,
        notes: updateNotes
      });
      
      setShowUpdateModal(false);
      setSelectedAllowance(null);
      setUpdateStatus('');
      setUpdateNotes('');
      
      // Refresh data
      await fetchMealAllowances(pagination.page);
      
    } catch (err) {
      setError('Gagal mengupdate status uang makan');
      console.error('Error updating meal allowance status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Menunggu' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Disetujui' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Ditolak' },
      paid: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, text: 'Dibayar' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {config.text}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchMealAllowances(newPage);
    }
  };

  useEffect(() => {
    fetchMealAllowances(1);
  }, [selectedPeriod, statusFilter]);

  if (loading && mealAllowances.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Uang Makan</h2>
          <p className="text-gray-600">Kelola semua klaim uang makan karyawan</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="all">Semua</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="paid">Dibayar</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Klaim</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_claims}</p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_claims}</p>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dibayar</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid_claims}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Dibayar</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.paid_amount)}</p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Meal Allowances Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Daftar Klaim Uang Makan</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Klaim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Kehadiran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mealAllowances.map((allowance) => (
                <tr key={allowance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="text-gray-400 mr-2" size={16} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {allowance.user?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {allowance.user?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(allowance.claim_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {allowance.attendance?.check_in_time ? 
                      new Date(allowance.attendance.check_in_time).toLocaleDateString('id-ID') : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(allowance.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(allowance.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedAllowance(allowance);
                        setUpdateStatus(allowance.status);
                        setUpdateNotes(allowance.notes || '');
                        setShowUpdateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Edit3 size={16} className="mr-1" />
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mealAllowances.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada klaim uang makan</h3>
              <p className="mt-1 text-sm text-gray-500">Klaim akan muncul ketika karyawan mengajukan</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const page = i + Math.max(1, pagination.page - 2);
                if (page > pagination.total_pages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && selectedAllowance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Status Uang Makan</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">Karyawan:</p>
                <p className="font-medium">{selectedAllowance.user?.name}</p>
                <p className="text-sm text-gray-600 mt-1">Jumlah: {formatCurrency(selectedAllowance.amount)}</p>
                <p className="text-sm text-gray-600">Tanggal Klaim: {new Date(selectedAllowance.claim_date).toLocaleDateString('id-ID')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                  <option value="paid">Dibayar</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Admin
                </label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambahkan catatan admin..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedAllowance(null);
                  setUpdateStatus('');
                  setUpdateNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!updateStatus || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealAllowanceManagement;