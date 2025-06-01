"use client";
import React, { useState } from 'react';
import { BarChart3, Users, Clock, MapPin, Camera } from 'lucide-react';
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceCheckIn from './AttendanceCheckIn';
import AttendanceReports from './AttendanceReports';
import { individualUsers } from '../../data/initialData';

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use data from initialData
  const [employees] = useState([
    ...individualUsers.map(user => ({
      ...user,
      status: user.status || 'not-available',
      lastAction: user.lastAction || 'No recent activity'
    })),
    {
      id: 'EMP006',
      name: 'Jane Smith',
      department: 'Marketing',
      role: 'employee',
      email: 'jane.smith@company.com',
      phone: '+62812345679',
      joinDate: '2024-02-01',
      status: 'checked-out',
      lastAction: '17:30 yesterday'
    },
    {
      id: 'EMP007', 
      name: 'Mike Johnson',
      department: 'Operations',
      role: 'employee',
      email: 'mike.johnson@company.com',
      phone: '+62812345680',
      joinDate: '2024-03-15',
      status: 'checked-in',
      lastAction: '08:45 today'
    },
    {
      id: 'EMP005', // Changed from EMP004 to EMP005
      name: 'Sarah Wilson', 
      department: 'Customer Service',
      role: 'employee',
      email: 'sarah.wilson@company.com',
      phone: '+62812345681',
      joinDate: '2024-01-20',
      status: 'checked-out',
      lastAction: '18:00 yesterday'
    }
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState([
    { 
      id: 1, 
      employeeId: 'EMP001',
      employee: 'John Doe', 
      date: '2025-05-30', 
      checkIn: '09:15', 
      checkOut: '18:30', 
      hours: '9h 15m', 
      status: 'present', 
      fraudScore: 5,
      location: 'Main Office',
      overtime: '0h 15m'
    },
    { 
      id: 2, 
      employeeId: 'EMP002',
      employee: 'Jane Smith', 
      date: '2025-05-30', 
      checkIn: '08:30', 
      checkOut: '17:45', 
      hours: '9h 15m', 
      status: 'present', 
      fraudScore: 2,
      location: 'Main Office',
      overtime: '0h 15m'
    },
    { 
      id: 3, 
      employeeId: 'EMP003',
      employee: 'Mike Johnson', 
      date: '2025-05-30', 
      checkIn: '08:45', 
      checkOut: '--', 
      hours: '9h 30m*', 
      status: 'active', 
      fraudScore: 8,
      location: 'Main Office',
      overtime: '0h 30m'
    },
    { 
      id: 4, 
      employeeId: 'EMP005',
      employee: 'Sarah Wilson', 
      date: '2025-05-30', 
      checkIn: '--', 
      checkOut: '--', 
      hours: '0h', 
      status: 'absent', 
      fraudScore: 0,
      location: '--',
      overtime: '0h'
    }
  ]);

  const handleAttendanceSubmit = (attendanceData) => {
    const newRecord = {
      id: attendanceRecords.length + 1,
      employeeId: attendanceData.employeeId,
      employee: attendanceData.employeeName,
      date: new Date().toISOString().split('T')[0],
      checkIn: attendanceData.timestamp,
      checkOut: '--',
      hours: '--',
      status: 'active',
      fraudScore: Math.floor(Math.random() * 10),
      location: attendanceData.location?.name || 'Unknown',
      overtime: '0h'
    };
    
    setAttendanceRecords(prev => [...prev, newRecord]);
  };

  const allowedLocations = [
    {
      name: 'Main Office',
      latitude: -6.2088,
      longitude: 106.8456,
      radius: 100
    },
    {
      name: 'Branch Office',
      latitude: -6.1751,
      longitude: 106.8650,
      radius: 100
    }
  ];

  switch (activeTab) {
    case 'checkin':
      return (
        <AttendanceCheckIn 
          employee={employees[0]} // In real app, this would be the current user
          onSubmit={handleAttendanceSubmit}
          allowedLocations={allowedLocations}
        />
      );
    case 'reports':
      return <AttendanceReports records={attendanceRecords} employees={employees} />;
    default:
      return <AttendanceDashboard employees={employees} attendanceRecords={attendanceRecords} />;
  }
};

export default AttendanceManagement;