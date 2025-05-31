"use client";
import React, { useState } from 'react';
import { BarChart3, Users, Clock, MapPin, Camera } from 'lucide-react';
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceCheckIn from './AttendanceCheckIn';
import AttendanceRecords from './AttendanceRecords';
import AttendanceReports from './AttendanceReports';

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees] = useState([
    { id: 1, name: 'John Doe', department: 'Engineering', status: 'checked-in', lastAction: '09:15 AM', location: 'Office Building A' },
    { id: 2, name: 'Jane Smith', department: 'Marketing', status: 'checked-out', lastAction: '06:30 PM', location: 'Office Building B' },
    { id: 3, name: 'Mike Johnson', department: 'HR', status: 'checked-in', lastAction: '08:45 AM', location: 'Office Building A' },
    { id: 4, name: 'Sarah Wilson', department: 'Finance', status: 'absent', lastAction: 'No activity', location: 'N/A' },
    { id: 5, name: 'Admin User', department: 'Management', status: 'checked-in', lastAction: '08:00 AM', location: 'Main Office' },
    { id: 6, name: 'Kitchen Staff', department: 'Kitchen', status: 'checked-in', lastAction: '07:30 AM', location: 'Kitchen Area' },
    { id: 7, name: 'Cashier Staff', department: 'Front Desk', status: 'checked-in', lastAction: '08:15 AM', location: 'Reception' },
  ]);
  
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, employee: 'John Doe', date: '2025-05-30', checkIn: '09:15', checkOut: '18:30', hours: '9h 15m', status: 'present', fraudScore: 5 },
    { id: 2, employee: 'Jane Smith', date: '2025-05-30', checkIn: '08:30', checkOut: '17:45', hours: '9h 15m', status: 'present', fraudScore: 2 },
    { id: 3, employee: 'Mike Johnson', date: '2025-05-30', checkIn: '08:45', checkOut: '--', hours: '9h 30m*', status: 'active', fraudScore: 8 },
    { id: 4, employee: 'Sarah Wilson', date: '2025-05-30', checkIn: '--', checkOut: '--', hours: '0h', status: 'absent', fraudScore: 0 },
  ]);

  // Allowed locations for check-in (cyber cafe locations)
  const allowedLocations = [
    {
      name: 'Main Office',
      latitude: -6.3353889,
      longitude: 106.4733848,
      radius: 100 // meters
    },
    {
      name: 'Branch Office',
      latitude: -6.2000,
      longitude: 106.8400,
      radius: 100
    }
  ];

  const handleAttendanceSubmit = async (attendanceData) => {
    try {
      // Here you would typically send data to your backend
      console.log('Attendance submitted:', attendanceData);
      
      // Add to records
      const newRecord = {
        id: attendanceRecords.length + 1,
        employee: attendanceData.employeeName,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        checkOut: '--',
        hours: '--',
        status: 'active',
        fraudScore: 1,
        photo: attendanceData.photo,
        location: attendanceData.location
      };
      
      setAttendanceRecords(prev => [newRecord, ...prev]);
      
      // Show success message
      alert('Attendance recorded successfully!');
      
      // Reset to dashboard
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      throw error;
    }
  };

  const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        active 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AttendanceDashboard employees={employees} attendanceRecords={attendanceRecords} />;
      case 'checkin':
        return (
          <AttendanceCheckIn
            employee={employees[0]} // In real app, this would be the current user
            onSubmit={handleAttendanceSubmit}
            allowedLocations={allowedLocations}
          />
        );
      case 'records':
        return <AttendanceRecords records={attendanceRecords} />;
      case 'reports':
        return <AttendanceReports records={attendanceRecords} employees={employees} />;
      default:
        return <AttendanceDashboard employees={employees} attendanceRecords={attendanceRecords} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Modern attendance system with photo verification and location tracking</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton
            id="dashboard"
            label="Dashboard"
            icon={BarChart3}
            active={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          <TabButton
            id="checkin"
            label="Check In/Out"
            icon={Camera}
            active={activeTab === 'checkin'}
            onClick={setActiveTab}
          />
          <TabButton
            id="records"
            label="Records"
            icon={Clock}
            active={activeTab === 'records'}
            onClick={setActiveTab}
          />
          <TabButton
            id="reports"
            label="Reports"
            icon={Users}
            active={activeTab === 'reports'}
            onClick={setActiveTab}
          />
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default AttendanceManagement;