import React, { useState, useEffect } from 'react';
import { User, Clock, Calendar, Camera, BarChart3, History } from 'lucide-react';
import IndividualCheckIn from './IndividualCheckIn';
import IndividualHistory from './IndividualHistory';
import IndividualStats from './IndividualStats';

const IndividualAttendance = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [userAttendance, setUserAttendance] = useState([
    {
      id: 1,
      date: '2025-01-15',
      checkIn: '08:30',
      checkOut: '17:45',
      hours: '9h 15m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 2,
      date: '2025-01-14',
      checkIn: '08:45',
      checkOut: '18:00',
      hours: '9h 15m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 3,
      date: '2025-01-13',
      checkIn: '09:00',
      checkOut: '17:30',
      hours: '8h 30m',
      status: 'late',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 4,
      date: '2025-01-12',
      checkIn: '08:15',
      checkOut: '17:30',
      hours: '9h 15m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 5,
      date: '2025-01-11',
      checkIn: '08:30',
      checkOut: '17:45',
      hours: '9h 15m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 6,
      date: '2025-01-10',
      checkIn: '--',
      checkOut: '--',
      hours: '--',
      status: 'absent',
      photo: null,
      location: '--'
    },
    {
      id: 7,
      date: '2025-01-09',
      checkIn: '08:45',
      checkOut: '17:30',
      hours: '8h 45m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 8,
      date: '2025-01-08',
      checkIn: '09:15',
      checkOut: '18:00',
      hours: '8h 45m',
      status: 'late',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 9,
      date: '2025-01-07',
      checkIn: '08:20',
      checkOut: '17:45',
      hours: '9h 25m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    },
    {
      id: 10,
      date: '2025-01-06',
      checkIn: '08:35',
      checkOut: '17:30',
      hours: '8h 55m',
      status: 'present',
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      location: 'Main Office'
    }
  ]);

  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    // Check if user already checked in today
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = userAttendance.find(record => record.date === today);
    setTodayAttendance(todayRecord);
  }, [userAttendance]);

  const handleAttendanceSubmit = async (attendanceData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      if (todayAttendance) {
        // Check out
        const updatedRecord = {
          ...todayAttendance,
          checkOut: currentTime,
          hours: calculateHours(todayAttendance.checkIn, currentTime)
        };
        
        setUserAttendance(prev => 
          prev.map(record => 
            record.id === todayAttendance.id ? updatedRecord : record
          )
        );
        setTodayAttendance(updatedRecord);
      } else {
        // Check in
        const newRecord = {
          id: Date.now(),
          date: today,
          checkIn: currentTime,
          checkOut: '--',
          hours: '--',
          status: 'active',
          photo: attendanceData.photo,
          location: attendanceData.location?.name || 'Unknown'
        };
        
        setUserAttendance(prev => [newRecord, ...prev]);
        setTodayAttendance(newRecord);
      }

      alert(todayAttendance ? 'Check-out berhasil!' : 'Check-in berhasil!');
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      throw error;
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
    switch (activeTab) {
      case 'checkin':
        return (
          <IndividualCheckIn
            currentUser={currentUser}
            todayAttendance={todayAttendance}
            onSubmit={handleAttendanceSubmit}
          />
        );
      case 'history':
        return (
          <IndividualHistory
            attendanceRecords={userAttendance}
            currentUser={currentUser}
          />
        );
      case 'stats':
        return (
          <IndividualStats
            attendanceRecords={userAttendance}
            currentUser={currentUser}
          />
        );
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
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton
          id="checkin"
          label="Absen"
          icon={Clock}
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