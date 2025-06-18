import React, { useState, useEffect } from 'react';
import { User, Clock, Calendar, Camera, BarChart3, History, CheckCircle, XCircle, X } from 'lucide-react';
import IndividualCheckIn from './IndividualCheckIn';
import IndividualHistory from './IndividualHistory';
import IndividualStats from './IndividualStats';
import { attendanceService } from '../../services/attendanceService';

const IndividualAttendance = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [userAttendance, setUserAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });

  // Function to show snackbar
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Function to hide snackbar
  const hideSnackbar = () => {
    setSnackbar({ show: false, message: '', type: 'success' });
  };

  // Fetch attendance data from backend
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      console.log('[INDIVIDUAL ATTENDANCE] Fetching attendance data from backend...');
      
      // Get user's attendance history
      const attendanceResponse = await attendanceService.getMyAttendance();
      console.log('[INDIVIDUAL ATTENDANCE] Attendance history:', attendanceResponse);
      setUserAttendance(attendanceResponse.data || []);
      
      // Get today's attendance
      const todayResponse = await attendanceService.getTodayAttendance();
      console.log('[INDIVIDUAL ATTENDANCE] Today attendance:', todayResponse);
      
      // Transform backend data to frontend format
      let transformedTodayAttendance = null;
      if (todayResponse.data && todayResponse.data.checked_in) {
        const attendance = todayResponse.data.attendance;
        transformedTodayAttendance = {
          id: attendance?.id,
          date: todayResponse.data.date,
          checkIn: attendance?.check_in_time ? 
            new Date(attendance.check_in_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '--',
          checkOut: attendance?.check_out_time ? 
            new Date(attendance.check_out_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '--',
          checked_in: todayResponse.data.checked_in,
          checked_out: todayResponse.data.checked_out,
          status: todayResponse.data.checked_out ? 'completed' : 'active'
        };
      }
      
      setTodayAttendance(transformedTodayAttendance);
      setError(null);
      
    } catch (error) {
      console.error('[INDIVIDUAL ATTENDANCE] Error fetching attendance data:', error);
      setError('Gagal memuat data absensi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // ✅ PERBAIKAN: Definisikan fungsi handleAttendanceSubmit yang hilang
  const handleAttendanceSubmit = async (attendanceData) => {
    console.log('[INDIVIDUAL ATTENDANCE] Submitting attendance:', attendanceData);
    
    if (!attendanceData.photo) {
      throw new Error('Foto wajib diambil untuk absensi');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('employee_id', currentUser?.id || '1');
      
      // ✅ PERBAIKAN: Handle photo data dengan format yang benar
      let photoBlob;
      
      // Cek apakah foto adalah objek dengan properti blob dan url
      if (attendanceData.photo && typeof attendanceData.photo === 'object') {
        if (attendanceData.photo.blob instanceof Blob) {
          // Foto dari IndividualCheckIn dalam format { blob, url }
          photoBlob = attendanceData.photo.blob;
          console.log('✅ Photo object detected:', {
            size: photoBlob.size,
            type: photoBlob.type
          });
        } else if (attendanceData.photo instanceof Blob) {
          // Foto langsung dalam format Blob
          photoBlob = attendanceData.photo;
          console.log('✅ Direct blob detected:', {
            size: photoBlob.size,
            type: photoBlob.type
          });
        } else {
          throw new Error('Format objek foto tidak valid');
        }
      } else if (typeof attendanceData.photo === 'string') {
        // Convert base64 to blob
        try {
          const response = await fetch(attendanceData.photo);
          photoBlob = await response.blob();
          console.log('✅ Photo converted from base64 to blob:', {
            size: photoBlob.size,
            type: photoBlob.type
          });
        } catch (error) {
          console.error('❌ Error converting photo to blob:', error);
          throw new Error('Gagal memproses foto. Silakan ambil foto ulang.');
        }
      } else {
        throw new Error('Format foto tidak dikenali. Silakan ambil foto ulang.');
      }
  
      // ✅ VALIDASI: Pastikan blob valid dan tidak kosong
      if (!photoBlob || photoBlob.size === 0) {
        throw new Error('Foto kosong atau rusak. Silakan ambil foto ulang.');
      }
  
      if (photoBlob.size < 1000) { // Kurang dari 1KB kemungkinan corrupt
        throw new Error('Foto terlalu kecil atau rusak. Silakan ambil foto ulang.');
      }
  
      // ✅ PERBAIKAN: Tambahkan timestamp ke nama file untuk uniqueness
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `attendance-${timestamp}.jpg`;
      
      formData.append('photo', photoBlob, filename);
      console.log('✅ Photo added to FormData:', {
        filename,
        size: photoBlob.size,
        type: photoBlob.type
      });
  
      // Add location data
      if (attendanceData.location) {
        formData.append('latitude', attendanceData.location.latitude.toString());
        formData.append('longitude', attendanceData.location.longitude.toString());
        formData.append('distance', attendanceData.location.distance.toString());
        formData.append('address', attendanceData.location.address || '');
        formData.append('location_name', attendanceData.location.nearest_location_name || '');
        formData.append('nearest_location_id', attendanceData.location.nearest_location_id?.toString() || '');
      }
      
      let response;
      if (todayAttendance && todayAttendance.checked_in && !todayAttendance.checked_out) {
        // Check out
        console.log('[INDIVIDUAL ATTENDANCE] Performing check-out...');
        response = await attendanceService.checkOut(formData);
        showSnackbar('Check-out berhasil!', 'success');
      } else {
        // Check in
        console.log('[INDIVIDUAL ATTENDANCE] Performing check-in...');
        response = await attendanceService.checkIn(formData);
        showSnackbar('Check-in berhasil!', 'success');
      }
      
      console.log('[INDIVIDUAL ATTENDANCE] Attendance response:', response);
      
      // Refresh data after successful submission
      await fetchAttendanceData();
      
    } catch (error) {
      console.error('[INDIVIDUAL ATTENDANCE] Failed to submit attendance:', error);
      const errorMessage = error.message || 'Gagal menyimpan data absensi';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (checkIn, checkOut) => {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    const diffMinutes = outMinutes - inMinutes;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Memuat data...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAttendanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'checkin':
        return (
          <IndividualCheckIn 
            todayAttendance={todayAttendance}
            onSubmit={handleAttendanceSubmit}
          />
        );
      case 'history':
        return <IndividualHistory currentUser={currentUser} />;
      case 'stats':
        return <IndividualStats currentUser={currentUser} />;
      default:
        return null;
    }
  };

  // Snackbar Component
  const Snackbar = () => {
    if (!snackbar.show) return null;

    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        snackbar.type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {snackbar.type === 'success' ? (
          <CheckCircle size={20} />
        ) : (
          <XCircle size={20} />
        )}
        <span className="font-medium">{snackbar.message}</span>
        <button 
          onClick={hideSnackbar}
          className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-800">Absensi Saya</h1>
        </div>
        <p className="text-gray-600">Kelola absensi dan lihat statistik kehadiran Anda</p>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{currentUser?.name || 'John Doe'}</h3>
            <p className="text-gray-600">{currentUser?.department || 'Engineering'}</p>
            <p className="text-sm text-gray-500">ID: {currentUser?.id || 'EMP001'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        <TabButton
          id="checkin"
          label="Absen"
          icon={Camera}
          active={activeTab === 'checkin'}
          onClick={setActiveTab}
        />
        <TabButton
          id="history"
          label="Riwayat"
          icon={History}
          active={activeTab === 'history'}
          onClick={setActiveTab}
        />
        <TabButton
          id="stats"
          label="Statistik"
          icon={BarChart3}
          active={activeTab === 'stats'}
          onClick={setActiveTab}
        />
      </div>

      {/* Content */}
      {renderContent()}
      </div>
      
      {/* Snackbar */}
      <Snackbar />
    </>
  );
};

export default IndividualAttendance;