import React, { useState, useEffect } from 'react';
import { Calendar, Users, Search, Filter, Download, Eye, Clock, MapPin, Camera } from 'lucide-react';
import { attendanceHistoryService } from '../../services/attendanceHistoryService';
import { staffService } from '../../services/staffService';

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user_id: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    date: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await staffService.getAllStaff();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit
      };

      // Add filters if they have values
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.month) params.month = filters.month;
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;

      const response = await attendanceHistoryService.getAttendanceHistory(params);
      
      if (response.data) {
        setAttendanceRecords(response.data);
        if (response.meta) {
          setPagination({
            total: response.meta.total,
            totalPages: response.meta.total_pages,
            currentPage: response.meta.page
          });
        }
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleExport = async () => {
    try {
      const params = {
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.month && { month: filters.month }),
        ...(filters.date && { date: filters.date }),
        ...(filters.status && { status: filters.status })
      };
      
      await attendanceHistoryService.exportAttendanceHistory(params);
    } catch (error) {
      console.error('Error exporting attendance history:', error);
      alert('Gagal mengekspor data kehadiran');
    }
  };

  const clearFilters = () => {
    setFilters({
      user_id: '',
      month: new Date().toISOString().slice(0, 7),
      date: '',
      status: '',
      page: 1,
      limit: 20
    });
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const getStatusBadge = (record) => {
    const checkInTime = new Date(record.check_in_time);
    
    let status = 'present';
    let bgColor = 'bg-green-100 text-green-800';
    let text = 'Hadir';
    
    // Check if late (after 9 AM)
    if (checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 0)) {
      status = 'late';
      bgColor = 'bg-yellow-100 text-yellow-800';
      text = 'Terlambat';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {text}
      </span>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatWorkingHours = (hours) => {
    if (!hours) return '0 jam';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} jam ${m} menit`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Histori Kehadiran</h1>
            <p className="text-gray-600 mt-1">Lihat dan kelola histori kehadiran karyawan</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Karyawan
            </label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Karyawan</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bulan
            </label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal Spesifik
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Hasil Pencarian ({pagination.total} record)
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Memuat data...</span>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-500">Tidak ada record kehadiran yang ditemukan dengan filter yang dipilih.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Karyawan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jam Kerja
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
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {(record.user?.name || record.user_name || 'Unknown').charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {record.user?.name || record.user_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.check_in_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatTime(record.check_in_time)}
                          </span>
                          {record.photo_path && (
                            <Camera className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatTime(record.check_out_time)}
                          </span>
                          {record.check_out_photo_path && (
                            <Camera className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatWorkingHours(record.working_hours)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((pagination.currentPage - 1) * filters.limit) + 1} - {Math.min(pagination.currentPage * filters.limit, pagination.total)} dari {pagination.total} record
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const current = pagination.currentPage;
                        return page === 1 || page === pagination.totalPages || (page >= current - 1 && page <= current + 1);
                      })
                      .map((page, index, array) => {
                        const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                page === pagination.currentPage
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detail Kehadiran - {selectedRecord.user?.name || selectedRecord.user_name || 'Unknown'}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedRecord.check_in_time)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedRecord)}
                </div>
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedRecord.check_in_time)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedRecord.check_out_time)}</p>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Kerja</label>
                <p className="text-sm text-gray-900">{formatWorkingHours(selectedRecord.working_hours)}</p>
              </div>

              {/* Location */}
              {(selectedRecord.address || selectedRecord.distance) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Lokasi
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedRecord.address || 'Alamat tidak tersedia'}
                    {selectedRecord.distance && (
                      <span className="text-gray-500 ml-2">({selectedRecord.distance}m dari kantor)</span>
                    )}
                  </p>
                </div>
              )}

              {/* Photos */}
              <div className="space-y-4">
                {selectedRecord.photo_path && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto Check In</label>
                    <img
                      src={`https://8080-firebase-cybercafemanagement-1750128536436.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev${selectedRecord.photo_path}`}
                      alt="Check In Photo"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(`https://8080-firebase-cybercafemanagement-1750128536436.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev${selectedRecord.photo_path}`, '_blank')}
                    />
                  </div>
                )}
                
                {selectedRecord.check_out_photo_path && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto Check Out</label>
                    <img
                      src={`https://8080-firebase-cybercafemanagement-1750128536436.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev${selectedRecord.check_out_photo_path}`}
                      alt="Check Out Photo"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(`https://8080-firebase-cybercafemanagement-1750128536436.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev${selectedRecord.check_out_photo_path}`, '_blank')}
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedRecord.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;