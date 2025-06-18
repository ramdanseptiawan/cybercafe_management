import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Download, Search, Filter, Eye, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react';
import { getMealAllowanceManagement, getEmployeeAttendanceDetail, getAllMealAllowances, updateMealAllowanceStatus, directApproveMealAllowance } from '../../services/mealAllowanceService';

const MealAllowanceManagementAdmin = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [claims, setClaims] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [showClaimsModal, setShowClaimsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [managementResponse, claimsResponse] = await Promise.all([
        getMealAllowanceManagement(filters.month, filters.year),
        getAllMealAllowances(1, 100, { month: filters.month, year: filters.year })
      ]);
      setData(managementResponse.data);
      setClaims(claimsResponse.data?.claims || []);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data rekap uang makan');
      setClaims([]); // Ensure claims is always an array
      console.error('Error fetching meal allowance management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId) => {
    try {
      setUpdating(claimId);
      await updateMealAllowanceStatus(claimId, 'approved');
      
      // Update claims state
      setClaims((claims || []).map(claim => 
        claim.id === claimId 
          ? { ...claim, status: 'approved', updated_at: new Date().toISOString() }
          : claim
      ));
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error approving claim:', err);
      alert('Gagal menyetujui klaim');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (claimId) => {
    const reason = prompt('Masukkan alasan penolakan (opsional):');
    if (reason === null) return; // User cancelled
    
    try {
      setUpdating(claimId);
      await updateMealAllowanceStatus(claimId, 'rejected', reason);
      
      // Update claims state
      setClaims((claims || []).map(claim => 
        claim.id === claimId 
          ? { ...claim, status: 'rejected', updated_at: new Date().toISOString() }
          : claim
      ));
      
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      alert('Gagal menolak klaim');
    } finally {
      setUpdating(null);
    }
  };



  const handleDirectApprove = async (employee) => {
    if (!window.confirm(`Apakah Anda yakin ingin menyetujui dan menandai sebagai sudah klaim uang makan untuk ${employee.name}?`)) {
      return;
    }

    setUpdating(employee.user_id);
    try {
      const claimData = {
        user_id: employee.user_id,
        month: filters.month,
        year: filters.year,
        amount: employee.total_meal_allowance
      };
      
       // Use the meal allowance service to create direct approval
         await directApproveMealAllowance(claimData);
       
       // Refresh data
       await fetchData();
       alert('Uang makan berhasil disetujui dan ditandai sebagai sudah klaim!');
     } catch (error) {
       console.error('Error approving meal allowance:', error);
       alert('Gagal menyetujui uang makan. Silakan coba lagi.');
     } finally {
       setUpdating(null);
     }
   };



  const handleExportCSV = () => {
    if (!data || !data.employees) return;

    const csvHeaders = [
      'Nama Pegawai',
      'Total Kehadiran',
      'Kehadiran Valid',
      'Total Uang Makan',
      'Status Klaim',
      'Tanggal Klaim'
    ];

    const csvData = data.employees.map(emp => [
      emp.name,
      emp.total_attendance,
      emp.valid_attendance,
      `Rp ${(emp.total_meal_allowance || 0).toLocaleString('id-ID')}`,
      emp.claim_status || 'Belum Klaim',
      emp.claim_date ? new Date(emp.claim_date).toLocaleDateString('id-ID') : '-'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap-uang-makan-${filters.month}-${filters.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = data?.employees?.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'claimed' && (emp.claim_status === 'approved' || emp.claim_status === 'claimed')) ||
      (filters.status === 'unclaimed' && (!emp.claim_status || emp.claim_status === 'pending'));
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status) => {
    if (status === 'approved' || status === 'claimed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (status) => {
    if (status === 'approved' || status === 'claimed') return 'Sudah Disetujui/Sudah Klaim';
    return 'Belum Klaim';
  };

  const handleViewAttendanceDetail = async (employee) => {
    setSelectedEmployee(employee);
    setShowAttendanceModal(true);
    setLoadingAttendance(true);
    
    try {
      const response = await getEmployeeAttendanceDetail(employee.user_id, filters.month, filters.year);
      setAttendanceDetails(response.data || []);
    } catch (err) {
      console.error('Error fetching attendance details:', err);
      setAttendanceDetails([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedEmployee(null);
    setAttendanceDetails([]);
    setLoadingAttendance(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Management Allowance Meal</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowClaimsModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Kelola Klaim ({(claims || []).filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pegawai</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.total_employees || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uang Makan</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {(data?.summary?.total_allowance || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Sudah Klaim</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.claimed_count || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Belum Klaim</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.unclaimed_count || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Klaim</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="claimed">Sudah Klaim</option>
              <option value="unclaimed">Belum Klaim</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Pegawai</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nama pegawai..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pegawai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Kehadiran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kehadiran Valid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Uang Makan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Klaim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Klaim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.total_attendance}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.valid_attendance}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Rp {(employee.total_meal_allowance || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(employee.claim_status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(employee.claim_status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.claim_date 
                          ? new Date(employee.claim_date).toLocaleDateString('id-ID')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleViewAttendanceDetail(employee)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Detail Kehadiran
                        </button>
                        
                        {/* Admin Action Buttons */}
                          {(!employee.claim_status || employee.claim_status === 'pending') && (
                            <button
                              onClick={() => handleDirectApprove(employee)}
                              disabled={updating === employee.user_id}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updating === employee.user_id ? (
                                <div className="w-3 h-3 mr-1 border border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Setujui/Klaim
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada data pegawai yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-4 text-sm text-gray-600">
        Menampilkan {filteredEmployees.length} dari {data?.employees?.length || 0} pegawai
      </div>

      {/* Attendance Detail Modal */}
      {showAttendanceModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detail Kehadiran - {selectedEmployee.name}
                </h3>
                <button
                  onClick={closeAttendanceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Total Kehadiran</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedEmployee.total_attendance}</div>
                    <div className="text-xs text-blue-700">hari dalam periode ini</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Kehadiran Valid</div>
                    <div className="text-2xl font-bold text-green-600">{selectedEmployee.valid_attendance}</div>
                    <div className="text-xs text-green-700">hari memenuhi syarat</div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-yellow-900">Total Tunjangan Makan</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    Rp {(selectedEmployee.total_meal_allowance || 0).toLocaleString('id-ID')}
                  </div>
                  <div className="text-xs text-yellow-700">
                    {selectedEmployee.valid_attendance || 0} hari × Rp 15.000 = Rp {(selectedEmployee.total_meal_allowance || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Status Klaim</div>
                  <div className="flex items-center mt-2">
                    {getStatusIcon(selectedEmployee.claim_status)}
                    <span className="ml-2 text-sm font-medium">
                      {getStatusText(selectedEmployee.claim_status)}
                    </span>
                  </div>
                  {selectedEmployee.claim_date && (
                    <div className="text-xs text-gray-600 mt-1">
                      Diklaim pada: {new Date(selectedEmployee.claim_date).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">Informasi Periode</div>
                  <div className="text-sm text-blue-700">
                    Bulan: {new Date(0, filters.month - 1).toLocaleString('id-ID', { month: 'long' })} {filters.year}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Data kehadiran untuk periode yang dipilih
                  </div>
                </div>
                
                {/* Attendance Details Section */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 mb-3">Detail Kehadiran</div>
                  {loadingAttendance ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : attendanceDetails.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {attendanceDetails.map((attendance, index) => (
                        <div key={attendance.id || index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(attendance.check_in_time).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attendance.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {attendance.is_valid ? 'Valid' : 'Tidak Valid'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Check In</div>
                              <div className="text-sm font-medium">
                                {new Date(attendance.check_in_time).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {attendance.photo_path && (
                                <img 
                                  src={`http://localhost:8080${attendance.photo_path}`}
                                  alt="Check In Photo"
                                  className="w-16 h-16 object-cover rounded mt-1 cursor-pointer"
                                  onClick={() => window.open(`http://localhost:8080${attendance.photo_path}`, '_blank')}
                                />
                              )}
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Check Out</div>
                              <div className="text-sm font-medium">
                                {attendance.check_out_time ? 
                                  new Date(attendance.check_out_time).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'Belum Check Out'
                                }
                              </div>
                              {attendance.check_out_photo_path && (
                                <img 
                                  src={`http://localhost:8080${attendance.check_out_photo_path}`}
                                  alt="Check Out Photo"
                                  className="w-16 h-16 object-cover rounded mt-1 cursor-pointer"
                                  onClick={() => window.open(`http://localhost:8080${attendance.check_out_photo_path}`, '_blank')}
                                />
                              )}
                            </div>
                          </div>
                          
                          {attendance.notes && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Catatan:</span> {attendance.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Tidak ada data kehadiran untuk periode ini
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={closeAttendanceModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims Management Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Kelola Klaim Uang Makan - {new Date(0, filters.month - 1).toLocaleString('id-ID', { month: 'long' })} {filters.year}
                </h3>
                <button
                  onClick={() => setShowClaimsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Pegawai
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Klaim
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal Klaim
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catatan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(claims || []).length > 0 ? (
                        (claims || []).map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{claim.user?.name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Rp {(claim.total_amount || 0).toLocaleString('id-ID')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {claim.created_at ? new Date(claim.created_at).toLocaleDateString('id-ID') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon(claim.status)}
                                <span className="ml-2 text-sm text-gray-900">
                                  {getStatusText(claim.status)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {claim.notes || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {claim.status === 'pending' ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApprove(claim.id)}
                                    disabled={updating === claim.id}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                  >
                                    {updating === claim.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3 mr-1" />
                                        Setujui
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleReject(claim.id)}
                                    disabled={updating === claim.id}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                  >
                                    {updating === claim.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 mr-1" />
                                        Tolak
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : claim.status === 'approved' ? (
                                <button
                                  onClick={() => handleMarkAsClaimed(claim.id)}
                                  disabled={updating === claim.id}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  {updating === claim.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Sudah Klaim
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                            Tidak ada klaim yang ditemukan
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowClaimsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealAllowanceManagementAdmin;