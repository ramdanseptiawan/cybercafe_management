import React, { useState, useEffect } from 'react';
import { User, Clock, Calendar, Camera, BarChart3, History } from 'lucide-react';
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
        // ✅ HAPUS alert, ganti dengan console log
        console.log('✅ Check-out berhasil!');
      } else {
        // Check in
        console.log('[INDIVIDUAL ATTENDANCE] Performing check-in...');
        response = await attendanceService.checkIn(formData);
        // ✅ HAPUS alert, ganti dengan console log
        console.log('✅ Check-in berhasil!');
      }
      
      console.log('[INDIVIDUAL ATTENDANCE] Attendance response:', response);
      
      // Refresh data after successful submission
      await fetchAttendanceData();
      
    } catch (error) {
      console.error('[INDIVIDUAL ATTENDANCE] Failed to submit attendance:', error);
      setError(error.message || 'Gagal menyimpan data absensi');
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

  return (
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
  );
};

export default IndividualAttendance;


const handleCheckIn = async () => {
  if (!photoData) {
    console.error('No photo data available for check-in');
    return;
  }
  
  setIsLoading(true);
  
  try {
    console.log('Starting check-in process with photo:', {
      hasBlob: !!photoData.blob,
      hasUrl: !!photoData.url,
      size: photoData.blob?.size,
      type: photoData.blob?.type
    });
    
    // Validasi foto sebelum upload
    if (!photoData.blob || photoData.blob.size < 1024) {
      throw new Error('Foto tidak valid atau terlalu kecil');
    }
    
    if (photoData.blob.size > 10 * 1024 * 1024) { // Max 10MB
      throw new Error('Ukuran foto terlalu besar (maksimal 10MB)');
    }
    
    // Buat FormData dengan blob langsung
    const formData = new FormData();
    formData.append('employee_id', employeeId);
    
    // Generate unique filename dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `checkin-${employeeId}-${timestamp}.jpg`;
    
    formData.append('photo', photoData.blob, filename);
    
    console.log('Uploading photo:', {
      filename: filename,
      size: photoData.blob.size,
      type: photoData.blob.type
    });
    
    const response = await fetch('http://localhost:8080/api/attendance/checkin', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Check-in failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Check-in successful:', result);
    
    // Hapus alert, ganti dengan console log
    console.log('✅ Check-in berhasil!');
    
    // Reset photo data
    setPhotoData(null);
    
    // Refresh attendance data
    if (onAttendanceUpdate) {
      onAttendanceUpdate();
    }
    
  } catch (error) {
    console.error('Check-in error:', error);
    // Tampilkan error ke user jika perlu
  } finally {
    setIsLoading(false);
  }
};

const handleCheckOut = async () => {
  if (!photoData) {
    console.error('No photo data available for check-out');
    return;
  }
  
  setIsLoading(true);
  
  try {
    console.log('Starting check-out process with photo:', {
      hasBlob: !!photoData.blob,
      hasUrl: !!photoData.url,
      size: photoData.blob?.size,
      type: photoData.blob?.type
    });
    
    // Validasi foto sebelum upload
    if (!photoData.blob || photoData.blob.size < 1024) {
      throw new Error('Foto tidak valid atau terlalu kecil');
    }
    
    if (photoData.blob.size > 10 * 1024 * 1024) { // Max 10MB
      throw new Error('Ukuran foto terlalu besar (maksimal 10MB)');
    }
    
    // Buat FormData dengan blob langsung
    const formData = new FormData();
    formData.append('employee_id', employeeId);
    
    // Generate unique filename dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `checkout-${employeeId}-${timestamp}.jpg`;
    
    formData.append('photo', photoData.blob, filename);
    
    console.log('Uploading photo:', {
      filename: filename,
      size: photoData.blob.size,
      type: photoData.blob.type
    });
    
    const response = await fetch('http://localhost:8080/api/attendance/checkout', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Check-out failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Check-out successful:', result);
    
    // Hapus alert, ganti dengan console log
    console.log('✅ Check-out berhasil!');
    
    // Reset photo data
    setPhotoData(null);
    
    // Refresh attendance data
    if (onAttendanceUpdate) {
      onAttendanceUpdate();
    }
    
  } catch (error) {
    console.error('Check-out error:', error);
    // Tampilkan error ke user jika perlu
  } finally {
    setIsLoading(false);
  }
};