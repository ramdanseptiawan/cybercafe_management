import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, Calendar, Award, Target } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';

const IndividualStats = ({ currentUser }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate working hours
  const calculateHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return '--';
    
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffMs = checkOut - checkIn;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Determine attendance status
  const determineStatus = (record) => {
    if (!record.check_in_time) return 'absent';
    if (!record.check_out_time) return 'active';
    
    // Check if late (assuming work starts at 09:00)
    const checkInTime = new Date(record.check_in_time);
    const workStartTime = new Date(checkInTime);
    workStartTime.setHours(9, 0, 0, 0);
    
    return checkInTime > workStartTime ? 'late' : 'present';
  };

  // Get date range parameters based on selected period
  const getDateParams = () => {
    const now = new Date();
    const params = { page: 1, limit: 1000 };
    
    switch (selectedPeriod) {
      case 'month':
        params.month = (now.getMonth() + 1).toString();
        params.year = now.getFullYear().toString();
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3 + 1;
        // For quarter, we'll fetch the whole year and filter in frontend
        params.year = now.getFullYear().toString();
        break;
      case 'year':
        params.year = now.getFullYear().toString();
        break;
    }
    
    return params;
  };

  // Fetch attendance data from backend
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = getDateParams();
      console.log('Fetching attendance with params:', params);
      
      const response = await attendanceService.getMyAttendance(params);
      console.log('Attendance response:', response);
      
      // Handle paginated response structure
      const attendanceData = response.data || response;
      
      // Transform backend data
      const transformedRecords = attendanceData.map(record => {
        const checkInDate = new Date(record.check_in_time);
        return {
          id: record.id,
          date: checkInDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
          checkIn: record.check_in_time ? 
            new Date(record.check_in_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '--',
          checkOut: record.check_out_time ? 
            new Date(record.check_out_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '--',
          hours: record.check_in_time && record.check_out_time ? 
            calculateHours(record.check_in_time, record.check_out_time) : '--',
          status: determineStatus(record),
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time
        };
      });
      
      setAttendanceRecords(transformedRecords);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
      setError('Gagal memuat statistik absensi');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or period changes
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedPeriod]);

  const stats = useMemo(() => {
    const now = new Date();
    let filteredRecords = [];

    // Filter records based on selected period
    switch (selectedPeriod) {
      case 'month':
        // Already filtered by backend
        filteredRecords = attendanceRecords;
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        
        filteredRecords = attendanceRecords.filter(record => {
          const recordDate = new Date(record.date);
          const recordMonth = recordDate.getMonth();
          return recordMonth >= quarterStartMonth && recordMonth <= quarterEndMonth;
        });
        break;
      case 'year':
        // Already filtered by backend
        filteredRecords = attendanceRecords;
        break;
      default:
        filteredRecords = attendanceRecords;
    }

    // Calculate expected working days for the period
    const getExpectedWorkingDays = () => {
      const today = new Date();
      let startDate, endDate;
      
      switch (selectedPeriod) {
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'quarter':
          const currentQuarter = Math.floor(today.getMonth() / 3);
          startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
          endDate = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          break;
        default:
          return filteredRecords.length;
      }
      
      // Count working days (Monday to Friday)
      let workingDays = 0;
      const currentDate = new Date(startDate);
      const maxDate = today < endDate ? today : endDate;
      
      while (currentDate <= maxDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return workingDays;
    };

    const expectedWorkingDays = getExpectedWorkingDays();
    const actualAttendanceDays = filteredRecords.length;
    const presentDays = filteredRecords.filter(r => r.status === 'present').length;
    const lateDays = filteredRecords.filter(r => r.status === 'late').length;
    const activeDays = filteredRecords.filter(r => r.status === 'active').length;
    const absentDays = Math.max(0, expectedWorkingDays - actualAttendanceDays);
    
    const attendanceRate = expectedWorkingDays > 0 ? ((actualAttendanceDays) / expectedWorkingDays) * 100 : 0;
    const punctualityRate = (presentDays + lateDays + activeDays) > 0 ? (presentDays / (presentDays + lateDays + activeDays)) * 100 : 0;
    
    // Calculate average working hours
    const workingRecords = filteredRecords.filter(r => r.hours !== '--' && r.status !== 'active');
    const totalHours = workingRecords.reduce((sum, record) => {
      const [hours, minutes] = record.hours.split('h ');
      const totalMinutes = parseInt(hours) * 60 + parseInt(minutes.replace('m', ''));
      return sum + totalMinutes;
    }, 0);
    const avgWorkingHours = workingRecords.length > 0 ? totalHours / workingRecords.length / 60 : 0;

    return {
      expectedWorkingDays,
      actualAttendanceDays,
      presentDays,
      lateDays,
      activeDays,
      absentDays,
      attendanceRate,
      punctualityRate,
      avgWorkingHours
    };
  }, [attendanceRecords, selectedPeriod]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month': return 'Bulan Ini';
      case 'quarter': return 'Kuartal Ini';
      case 'year': return 'Tahun Ini';
      default: return 'Periode';
    }
  };

  const getPerformanceLevel = (rate) => {
    if (rate >= 95) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 85) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 75) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const attendancePerformance = getPerformanceLevel(stats.attendanceRate);
  const punctualityPerformance = getPerformanceLevel(stats.punctualityRate);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium">Periode:</span>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="month">Bulan Ini</option>
          <option value="quarter">Kuartal Ini</option>
          <option value="year">Tahun Ini</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Memuat statistik...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchAttendanceData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stats Content */}
      {!loading && !error && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-blue-600" size={20} />
                <span className="text-blue-800 font-medium">Hari Kerja</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.actualAttendanceDays}/{stats.expectedWorkingDays}</div>
              <div className="text-sm text-blue-700">{getPeriodLabel()}</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <span className="text-green-800 font-medium">Tingkat Kehadiran</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.attendanceRate.toFixed(1)}%</div>
              <div className={`text-sm px-2 py-1 rounded-full ${attendancePerformance.bg} ${attendancePerformance.color} inline-block`}>
                {attendancePerformance.label}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-purple-600" size={20} />
                <span className="text-purple-800 font-medium">Ketepatan Waktu</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.punctualityRate.toFixed(1)}%</div>
              <div className={`text-sm px-2 py-1 rounded-full ${punctualityPerformance.bg} ${punctualityPerformance.color} inline-block`}>
                {punctualityPerformance.label}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-600" size={20} />
                <span className="text-orange-800 font-medium">Rata-rata Jam Kerja</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.avgWorkingHours.toFixed(1)}h</div>
              <div className="text-sm text-orange-700">Per hari</div>
            </div>
          </div>

          {/* Attendance Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={20} />
              Rincian Kehadiran
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Hadir Tepat Waktu</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.expectedWorkingDays > 0 ? (stats.presentDays / stats.expectedWorkingDays * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-12 text-right">{stats.presentDays}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Terlambat</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${stats.expectedWorkingDays > 0 ? (stats.lateDays / stats.expectedWorkingDays * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-12 text-right">{stats.lateDays}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sedang Aktif</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${stats.expectedWorkingDays > 0 ? (stats.activeDays / stats.expectedWorkingDays * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-12 text-right">{stats.activeDays}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tidak Hadir</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${stats.expectedWorkingDays > 0 ? (stats.absentDays / stats.expectedWorkingDays * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="font-medium w-12 text-right">{stats.absentDays}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Goals */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="text-purple-600" size={20} />
              Target Kinerja
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Kehadiran (Target: 95%)</span>
                  <span className="font-medium">{stats.attendanceRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      stats.attendanceRate >= 95 ? 'bg-green-500' : 
                      stats.attendanceRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Ketepatan Waktu (Target: 90%)</span>
                  <span className="font-medium">{stats.punctualityRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      stats.punctualityRate >= 90 ? 'bg-green-500' : 
                      stats.punctualityRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stats.punctualityRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Jam Kerja (Target: 8h)</span>
                  <span className="font-medium">{stats.avgWorkingHours.toFixed(1)}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      stats.avgWorkingHours >= 8 ? 'bg-green-500' : 
                      stats.avgWorkingHours >= 7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((stats.avgWorkingHours / 8) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            {stats.attendanceRate >= 95 && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-3">
                  <Award className="text-green-600" size={24} />
                  <div>
                    <h4 className="font-semibold text-green-800">Perfect Attendance!</h4>
                    <p className="text-green-700 text-sm">Anda mencapai tingkat kehadiran yang sangat baik untuk {getPeriodLabel().toLowerCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Attendance Records */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Riwayat Kehadiran Terbaru</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Tanggal</th>
                    <th className="text-left py-2">Masuk</th>
                    <th className="text-left py-2">Keluar</th>
                    <th className="text-left py-2">Jam Kerja</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.slice(0, 10).map(record => (
                    <tr key={record.id} className="border-b border-gray-100">
                      <td className="py-2">{record.date ? new Date(record.check_in_time).toLocaleDateString('id-ID') : '--'}</td>
                      <td className="py-2">{record.checkIn}</td>
                      <td className="py-2">{record.checkOut}</td>
                      <td className="py-2">{record.hours}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status === 'present' ? 'Hadir' :
                           record.status === 'late' ? 'Terlambat' :
                           record.status === 'active' ? 'Aktif' : 'Tidak Hadir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceRecords.length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada data kehadiran</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default IndividualStats;