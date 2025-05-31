"use client";
import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Users, Clock, AlertTriangle } from 'lucide-react';

const AttendanceReports = () => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Sample report data
  const reportData = {
    summary: {
      totalEmployees: 25,
      presentToday: 22,
      averageAttendance: 88,
      lateArrivals: 3,
      earlyDepartures: 1,
      overtime: 45.5
    },
    departmentStats: [
      { department: 'Engineering', present: 8, total: 10, percentage: 80 },
      { department: 'Marketing', present: 5, total: 6, percentage: 83 },
      { department: 'HR', present: 3, total: 3, percentage: 100 },
      { department: 'Finance', present: 4, total: 4, percentage: 100 },
      { department: 'Management', present: 2, total: 2, percentage: 100 }
    ],
    weeklyTrend: [
      { day: 'Mon', attendance: 92 },
      { day: 'Tue', attendance: 88 },
      { day: 'Wed', attendance: 85 },
      { day: 'Thu', attendance: 90 },
      { day: 'Fri', attendance: 87 },
      { day: 'Sat', attendance: 75 },
      { day: 'Sun', attendance: 70 }
    ]
  };

  const departments = ['Engineering', 'Marketing', 'HR', 'Finance', 'Management'];

  const generateReport = () => {
    // Generate and download report
    const reportContent = `Attendance Report - ${new Date().toLocaleDateString()}\n\n` +
      `Total Employees: ${reportData.summary.totalEmployees}\n` +
      `Present Today: ${reportData.summary.presentToday}\n` +
      `Average Attendance: ${reportData.summary.averageAttendance}%\n` +
      `Late Arrivals: ${reportData.summary.lateArrivals}\n` +
      `Early Departures: ${reportData.summary.earlyDepartures}\n` +
      `Total Overtime Hours: ${reportData.summary.overtime}\n\n` +
      `Department Breakdown:\n` +
      reportData.departmentStats.map(dept => 
        `${dept.department}: ${dept.present}/${dept.total} (${dept.percentage}%)`
      ).join('\n');

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const renderSummaryReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="Total Employees"
          value={reportData.summary.totalEmployees}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Present Today"
          value={reportData.summary.presentToday}
          subtitle={`${Math.round((reportData.summary.presentToday / reportData.summary.totalEmployees) * 100)}% attendance`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Average Attendance"
          value={`${reportData.summary.averageAttendance}%`}
          color="purple"
        />
        <StatCard
          icon={AlertTriangle}
          title="Late Arrivals"
          value={reportData.summary.lateArrivals}
          color="yellow"
        />
        <StatCard
          icon={Clock}
          title="Early Departures"
          value={reportData.summary.earlyDepartures}
          color="orange"
        />
        <StatCard
          icon={Clock}
          title="Overtime Hours"
          value={`${reportData.summary.overtime}h`}
          color="indigo"
        />
      </div>

      {/* Department Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Attendance</h3>
        <div className="space-y-4">
          {reportData.departmentStats.map((dept, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                  <span className="text-sm text-gray-600">{dept.present}/{dept.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dept.percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-900">{dept.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
        <div className="flex items-end justify-between h-40 space-x-2">
          {reportData.weeklyTrend.map((day, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ height: `${(day.attendance / 100) * 120}px` }}
                title={`${day.day}: ${day.attendance}%`}
              ></div>
              <span className="text-xs text-gray-600 mt-2">{day.day}</span>
              <span className="text-xs font-medium text-gray-900">{day.attendance}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailedReport = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Attendance Patterns</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Peak Check-in Time</span>
              <span className="font-medium">8:30 - 9:00 AM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Peak Check-out Time</span>
              <span className="font-medium">5:30 - 6:00 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Average Work Hours</span>
              <span className="font-medium">8h 45m</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Punctuality Rate</span>
              <span className="font-medium text-green-600">87%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Absenteeism Rate</span>
              <span className="font-medium text-red-600">12%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Overtime Frequency</span>
              <span className="font-medium text-orange-600">23%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Reports</h2>
          <p className="text-gray-600">Comprehensive attendance analytics and insights</p>
        </div>
        <button
          onClick={generateReport}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="summary">Summary Report</option>
          <option value="detailed">Detailed Analytics</option>
          <option value="department">Department Report</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Report Content */}
      {reportType === 'summary' && renderSummaryReport()}
      {reportType === 'detailed' && renderDetailedReport()}
      {reportType === 'department' && renderSummaryReport()}
    </div>
  );
};

export default AttendanceReports;