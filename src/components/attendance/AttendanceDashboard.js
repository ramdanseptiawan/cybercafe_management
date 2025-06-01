"use client";
import React, { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Camera, TrendingUp, AlertTriangle } from 'lucide-react';

const AttendanceDashboard = ({ employees = [], attendanceRecords = [] }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    
    const present = todayRecords.filter(record => record.status === 'present' || record.status === 'active').length;
    const absent = employees.length - present;
    const late = todayRecords.filter(record => {
      if (record.checkIn) {
        const checkInTime = new Date(`${record.date}T${record.checkIn}:00`);
        const workStartTime = new Date(`${record.date}T09:00:00`);
        return checkInTime > workStartTime;
      }
      return false;
    }).length;

    setStats({
      present,
      absent,
      late,
      total: employees.length
    });
  }, [employees, attendanceRecords]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Dashboard</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Current Time</p>
          <p className="text-xl font-bold text-blue-600">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Present Today" 
          value={stats.present} 
          icon={Users} 
          color="text-green-600"
          trend="+5% from yesterday"
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absent} 
          icon={AlertTriangle} 
          color="text-red-600"
        />
        <StatCard 
          title="Late Arrivals" 
          value={stats.late} 
          icon={Clock} 
          color="text-orange-600"
        />
        <StatCard 
          title="Total Employees" 
          value={stats.total} 
          icon={Users} 
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            Live Employee Status
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    emp.status === 'checked-in' ? 'bg-green-500' : 
                    emp.status === 'checked-out' ? 'bg-blue-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-600">{emp.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    emp.status === 'checked-in' ? 'text-green-600' : 
                    emp.status === 'checked-out' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {(emp.status || 'not-available').replace('-', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">{emp.lastAction || 'No recent activity'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="text-purple-600" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendanceRecords.slice(0, 10).map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-blue-600" />
                    <MapPin size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{record.employee}</p>
                    <p className="text-sm text-gray-600">{record.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {record.checkIn} - {record.checkOut || 'Active'}
                  </p>
                  <p className={`text-xs ${
                    record.status === 'present' ? 'text-green-600' :
                    record.status === 'active' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {record.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;