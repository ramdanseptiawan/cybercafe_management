import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { mealAllowanceService } from '../../services/mealAllowanceService';
import { attendanceService } from '../../services/attendanceService';

const MealAllowance = ({ currentUser }) => {
  const [mealAllowances, setMealAllowances] = useState([]);
  const [eligibleAttendances, setEligibleAttendances] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [stats, setStats] = useState({
    total_claims: 0,
    pending_claims: 0,
    approved_claims: 0,
    paid_claims: 0,
    total_amount: 0,
    paid_amount: 0
  });

  // Fetch meal allowance preview
  const fetchMealAllowancePreview = async () => {
    try {
      const response = await mealAllowanceService.getMealAllowancePreview();
      setPreview(response.data);
    } catch (err) {
      console.error('Error fetching meal allowance preview:', err);
    }
  };

  // Fetch meal allowances
  const fetchMealAllowances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      const params = { page: 1, limit: 100 };
      
      switch (selectedPeriod) {
        case 'month':
          params.month = (now.getMonth() + 1).toString();
          params.year = now.getFullYear().toString();
          break;
        case 'year':
          params.year = now.getFullYear().toString();
          break;
      }
      
      const response = await mealAllowanceService.getMyMealAllowances(params);
      setMealAllowances(response.data || []);
      
      // Fetch stats
      const statsResponse = await mealAllowanceService.getMealAllowanceStats({
        user_id: currentUser.id,
        ...params
      });
      setStats(statsResponse.data || stats);
      
    } catch (err) {
      setError('Gagal memuat data uang makan');
      console.error('Error fetching meal allowances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch eligible attendances for claiming
  const fetchEligibleAttendances = async () => {
    try {
      const now = new Date();
      const params = {
        page: 1,
        limit: 100,
        month: (now.getMonth() + 1).toString(),
        year: now.getFullYear().toString()
      };
      
      const response = await attendanceService.getMyAttendance(params);
      const attendances = response.data || [];
      
      // Filter attendances that are eligible and not yet claimed
      const claimedAttendanceIds = mealAllowances.map(ma => ma.attendance_id);
      const eligible = attendances.filter(attendance => 
        attendance.is_valid && 
        attendance.check_out_time && 
        !claimedAttendanceIds.includes(attendance.id)
      );
      
      setEligibleAttendances(eligible);
    } catch (err) {
      console.error('Error fetching eligible attendances:', err);
    }
  };

  // Claim meal allowance
  const handleClaimMealAllowance = async () => {
    if (!selectedAttendance) return;
    
    try {
      setLoading(true);
      
      await mealAllowanceService.claimMealAllowance({
        attendance_id: selectedAttendance.id,
        notes: claimNotes
      });
      
      setShowClaimModal(false);
      setSelectedAttendance(null);
      setClaimNotes('');
      
      // Refresh data
      await fetchMealAllowances();
      await fetchEligibleAttendances();
      await fetchMealAllowancePreview();
      
    } catch (err) {
      setError('Gagal mengklaim uang makan');
      console.error('Error claiming meal allowance:', err);
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

  useEffect(() => {
    fetchMealAllowances();
    fetchMealAllowancePreview();
  }, [selectedPeriod]);

  useEffect(() => {
    if (mealAllowances.length > 0) {
      fetchEligibleAttendances();
    }
  }, [mealAllowances]);

  useEffect(() => {
    fetchMealAllowancePreview();
  }, []);

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
          <h2 className="text-2xl font-bold text-gray-900">Uang Makan</h2>
          <p className="text-gray-600">Kelola klaim uang makan Anda</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          
          {eligibleAttendances.length > 0 && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Klaim Uang Makan
            </button>
          )}
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

      {/* Meal Allowance Preview */}
      {preview && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="mr-2 text-blue-600" size={20} />
              Uang Makan {preview.month}
            </h3>
            {preview.already_claimed && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Sudah Diklaim
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{preview.valid_days}</div>
              <div className="text-sm text-gray-600">Hari Masuk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(preview.rate_per_day)}
              </div>
              <div className="text-sm text-gray-600">Per Hari</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(preview.potential_amount)}
              </div>
              <div className="text-sm text-gray-600">
                {preview.already_claimed ? 'Total Diklaim' : 'Bisa Diklaim'}
              </div>
            </div>
          </div>
          
          {preview.already_claimed && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">Status Klaim</div>
                  <div className="mt-1">{getStatusBadge(preview.claim_status)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Tanggal Klaim</div>
                  <div className="text-sm font-medium">
                    {new Date(preview.claim_date).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!preview.already_claimed && preview.can_claim && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span className="text-green-700 text-sm font-medium">
                    Anda bisa mengklaim uang makan bulan ini!
                  </span>
                </div>
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Klaim Sekarang
                </button>
              </div>
            </div>
          )}
          
          {!preview.already_claimed && !preview.can_claim && preview.valid_days === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="text-yellow-500 mr-2" size={16} />
                <span className="text-yellow-700 text-sm">
                  Belum ada attendance yang valid bulan ini.
                </span>
              </div>
            </div>
          )}
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

      {/* Eligible Attendances Alert */}
      {eligibleAttendances.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            <span className="text-green-700">
              Anda memiliki {eligibleAttendances.length} kehadiran yang dapat diklaim untuk uang makan
            </span>
          </div>
        </div>
      )}

      {/* Meal Allowances Table */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Riwayat Klaim Uang Makan</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mealAllowances.map((allowance) => (
                <tr key={allowance.id} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {allowance.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {mealAllowances.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada klaim uang makan</h3>
              <p className="mt-1 text-sm text-gray-500">Mulai klaim uang makan untuk kehadiran yang valid</p>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Klaim Uang Makan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Kehadiran
                </label>
                <select
                  value={selectedAttendance?.id || ''}
                  onChange={(e) => {
                    const attendance = eligibleAttendances.find(a => a.id === e.target.value);
                    setSelectedAttendance(attendance);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih kehadiran...</option>
                  {eligibleAttendances.map((attendance) => (
                    <option key={attendance.id} value={attendance.id}>
                      {new Date(attendance.check_in_time).toLocaleDateString('id-ID')} - 
                      {new Date(attendance.check_in_time).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tambahkan catatan..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Jumlah uang makan: {formatCurrency(25000)}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Klaim akan diproses oleh admin setelah disubmit
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedAttendance(null);
                  setClaimNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleClaimMealAllowance}
                disabled={!selectedAttendance || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Memproses...' : 'Klaim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealAllowance;