"use client";
import React, { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Camera, TrendingUp, AlertTriangle, Loader } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { staffService } from '../../services/staffService';

const AttendanceDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  });
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch staff data
        const staffResponse = await staffService.getAllStaff();
        const staffData = staffResponse.data || staffResponse;
        
        // Fetch all attendance records for today (not just current user)
        const today = new Date().toISOString().split('T')[0];
        const allAttendanceResponse = await attendanceService.getAllAttendance({
          limit: 1000, // Get all records
          month: today.substring(0, 7) // Current month
        });
        const allAttendance = allAttendanceResponse.data || allAttendanceResponse;
        
        // Fetch recent attendance records
        const recentAttendanceResponse = await attendanceService.getAllAttendance({
          limit: 10,
          sort: 'check_in_time',
          order: 'desc'
        });
        const recentAttendance = recentAttendanceResponse.data || recentAttendanceResponse;
        
        setEmployees(staffData);
        setAttendanceRecords(recentAttendance);
        
        // Calculate today's stats
        calculateTodayStats(staffData, allAttendance);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Gagal memuat data dashboard. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateTodayStats = (staffData, allAttendance) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's attendance records
    const todayRecords = allAttendance.filter(record => {
      const recordDate = record.check_in_time ? 
        new Date(record.check_in_time).toISOString().split('T')[0] : null;
      return recordDate === today;
    });
    
    // Get unique users who checked in today
    const checkedInUserIds = new Set(todayRecords.map(record => record.user_id));
    
    // Calculate present (checked in)
    const present = checkedInUserIds.size;
    
    // Calculate late (checked in after 9:00 AM)
    const late = todayRecords.filter(record => {
      if (record.check_in_time) {
        const checkInTime = new Date(record.check_in_time);
        const workStart = new Date(checkInTime);
        workStart.setHours(9, 0, 0, 0); // 9:00 AM
        return checkInTime > workStart;
      }
      return false;
    }).length;
    
    // Calculate absent
    const absent = staffData.length - present;
    
    setStats({
      present,
      absent,
      late,
      total: staffData.length
    });
    
    // Update employee status based on today's attendance
    const updatedEmployees = staffData.map(emp => {
      const userAttendance = todayRecords.find(record => record.user_id === emp.id);
      
      if (userAttendance) {
        const isCheckedOut = userAttendance.check_out_time !== null;
        const checkInTime = new Date(userAttendance.check_in_time);
        const workStart = new Date(checkInTime);
        workStart.setHours(9, 0, 0, 0);
        const isLate = checkInTime > workStart;
        
        return {
          ...emp,
          status: isCheckedOut ? 'checked-out' : 'checked-in',
          lastAction: isCheckedOut ? 
            `Check-out: ${new Date(userAttendance.check_out_time).toLocaleTimeString('id-ID')}` :
            `Check-in: ${checkInTime.toLocaleTimeString('id-ID')}${isLate ? ' (Terlambat)' : ''}`,
          isLate
        };
      } else {
        return {
          ...emp,
          status: 'absent',
          lastAction: 'Belum check-in hari ini'
        };
      }
    });
    
    setEmployees(updatedEmployees);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          {trend && (
            <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
              <TrendingUp size={16} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} />
        <p className="text-red-800 font-medium mb-2">Error</p>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Absensi</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Waktu Saat Ini</p>
          <p className="text-xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString('id-ID')}
          </p>
          <p className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Hadir Hari Ini" 
          value={stats.present} 
          icon={Users} 
          color="text-green-600"
          trend="+5% dari kemarin"
        />
        <StatCard 
          title="Tidak Hadir" 
          value={stats.absent} 
          icon={AlertTriangle} 
          color="text-red-600"
        />
        <StatCard 
          title="Terlambat" 
          value={stats.late} 
          icon={Clock} 
          color="text-orange-600"
        />
        <StatCard 
          title="Total Karyawan" 
          value={stats.total} 
          icon={Users} 
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            Status Karyawan Hari Ini
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {employees.length > 0 ? employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    emp.status === 'checked-in' ? 'bg-green-500' : 
                    emp.status === 'checked-out' ? 'bg-blue-500' : 
                    emp.status === 'absent' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{emp.name || emp.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {emp.department || 
                       (typeof emp.role === 'object' ? emp.role?.name : emp.role) || 
                       'Unknown Department'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    emp.status === 'checked-in' ? (emp.isLate ? 'text-orange-600' : 'text-green-600') : 
                    emp.status === 'checked-out' ? 'text-blue-600' : 
                    emp.status === 'absent' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {emp.status === 'checked-in' ? (emp.isLate ? 'HADIR (TERLAMBAT)' : 'HADIR') :
                     emp.status === 'checked-out' ? 'PULANG' :
                     emp.status === 'absent' ? 'TIDAK HADIR' : 'TIDAK DIKETAHUI'}
                  </p>
                  <p className="text-xs text-gray-500">{emp.lastAction || 'Tidak ada aktivitas'}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">Tidak ada data karyawan</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="text-purple-600" size={20} />
            Aktivitas Terbaru
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendanceRecords.length > 0 ? attendanceRecords.slice(0, 10).map(record => {
              const checkInTime = record.check_in_time ? new Date(record.check_in_time) : null;
              const checkOutTime = record.check_out_time ? new Date(record.check_out_time) : null;
              const isLate = checkInTime ? (() => {
                const workStart = new Date(checkInTime);
                workStart.setHours(9, 0, 0, 0);
                return checkInTime > workStart;
              })() : false;
              
              return (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-blue-600" />
                      <MapPin size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {record.user?.name || record.User?.name || record.User?.full_name || record.employee || record.staff_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {checkInTime ? checkInTime.toLocaleDateString('id-ID') : 'Unknown Date'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {checkInTime ? checkInTime.toLocaleTimeString('id-ID') : '--:--'} - 
                      {checkOutTime ? checkOutTime.toLocaleTimeString('id-ID') : 'Aktif'}
                    </p>
                    <p className={`text-xs ${
                      checkOutTime ? 'text-blue-600' :
                      isLate ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {checkOutTime ? 'PULANG' : (isLate ? 'TERLAMBAT' : 'HADIR')}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-500 text-center py-4">Tidak ada data aktivitas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;