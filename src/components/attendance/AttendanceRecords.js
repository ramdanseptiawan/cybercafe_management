"use client";
import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AttendanceRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  // Sample attendance records data
  const [attendanceRecords] = useState([
    {
      id: 1,
      employeeId: 1,
      employeeName: 'John Doe',
      department: 'Engineering',
      date: '2024-01-15',
      checkIn: '09:15 AM',
      checkOut: '06:30 PM',
      workHours: '9h 15m',
      status: 'present',
      location: 'Office Building A',
      overtime: '1h 15m'
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Jane Smith',
      department: 'Marketing',
      date: '2024-01-15',
      checkIn: '08:45 AM',
      checkOut: '05:45 PM',
      workHours: '9h 00m',
      status: 'present',
      location: 'Office Building B',
      overtime: '1h 00m'
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Mike Johnson',
      department: 'HR',
      date: '2024-01-15',
      checkIn: '10:30 AM',
      checkOut: '06:15 PM',
      workHours: '7h 45m',
      status: 'late',
      location: 'Office Building A',
      overtime: '0h 00m'
    },
    {
      id: 4,
      employeeId: 4,
      employeeName: 'Sarah Wilson',
      department: 'Finance',
      date: '2024-01-15',
      checkIn: null,
      checkOut: null,
      workHours: '0h 00m',
      status: 'absent',
      location: 'N/A',
      overtime: '0h 00m'
    },
    {
      id: 5,
      employeeId: 5,
      employeeName: 'Admin User',
      department: 'Management',
      date: '2024-01-15',
      checkIn: '08:00 AM',
      checkOut: '07:00 PM',
      workHours: '11h 00m',
      status: 'present',
      location: 'Main Office',
      overtime: '3h 00m'
    }
  ]);

  const departments = ['Engineering', 'Marketing', 'HR', 'Finance', 'Management', 'Kitchen', 'Front Desk'];

  // Filter and search records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      const matchesDepartment = filterDepartment === 'all' || record.department === filterDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [attendanceRecords, searchTerm, filterStatus, filterDepartment]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportRecords = () => {
    // Simple CSV export functionality
    const csvContent = [
      ['Employee Name', 'Department', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Location', 'Overtime'],
      ...filteredRecords.map(record => [
        record.employeeName,
        record.department,
        record.date,
        record.checkIn || 'N/A',
        record.checkOut || 'N/A',
        record.workHours,
        record.status,
        record.location,
        record.overtime
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Records</h2>
          <p className="text-gray-600">View and manage employee attendance history</p>
        </div>
        <button
          onClick={exportRecords}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>

        {/* Department Filter */}
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Employee</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Department</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Date</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Check In</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Check Out</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Work Hours</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Status</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Location</th>
              <th className="text-left p-4 font-semibold text-gray-900 border-b">Overtime</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{record.employeeName}</span>
                  </div>
                </td>
                <td className="p-4 border-b text-gray-600">{record.department}</td>
                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{record.date}</span>
                  </div>
                </td>
                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-gray-900">{record.checkIn || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="text-gray-900">{record.checkOut || 'N/A'}</span>
                  </div>
                </td>
                <td className="p-4 border-b font-medium text-gray-900">{record.workHours}</td>
                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{record.location}</span>
                  </div>
                </td>
                <td className="p-4 border-b">
                  <span className={`font-medium ${
                    record.overtime !== '0h 00m' ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {record.overtime}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results message */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <span>Total Records: {filteredRecords.length}</span>
        <span>Present: {filteredRecords.filter(r => r.status === 'present').length}</span>
        <span>Late: {filteredRecords.filter(r => r.status === 'late').length}</span>
        <span>Absent: {filteredRecords.filter(r => r.status === 'absent').length}</span>
      </div>
    </div>
  );
};

export default AttendanceRecords;