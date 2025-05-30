import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Shield, User, Calendar, BarChart3, AlertTriangle, CheckCircle, XCircle, Camera, Fingerprint, MapPinned, Activity, Users, TrendingUp, Timer } from 'lucide-react';

const AttendanceManagement = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
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
  
  const [attendanceRecords] = useState([
    { id: 1, employee: 'John Doe', date: '2025-05-30', checkIn: '09:15', checkOut: '18:30', hours: '9h 15m', status: 'present', fraudScore: 5 },
    { id: 2, employee: 'Jane Smith', date: '2025-05-30', checkIn: '08:30', checkOut: '17:45', hours: '9h 15m', status: 'present', fraudScore: 2 },
    { id: 3, employee: 'Mike Johnson', date: '2025-05-30', checkIn: '08:45', checkOut: '--', hours: '9h 30m*', status: 'active', fraudScore: 8 },
    { id: 4, employee: 'Sarah Wilson', date: '2025-05-30', checkIn: '--', checkOut: '--', hours: '0h', status: 'absent', fraudScore: 0 },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const simulateBiometricScan = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      alert('Biometric verification successful!');
    }, 3000);
  };

  const requestLocation = () => {
    setLocationPermission(true);
    // Simulate location request
    setTimeout(() => {
      alert('Location verified: Office Building A');
    }, 1000);
  };

  const getFraudRiskColor = (score) => {
    if (score <= 3) return 'text-green-600 bg-green-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFraudRiskText = (score) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
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

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
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
          value="3" 
          icon={Users} 
          color="text-green-600"
          trend="+5% from yesterday"
        />
        <StatCard 
          title="Total Employees" 
          value="4" 
          icon={User} 
          color="text-blue-600"
        />
        <StatCard 
          title="Avg. Work Hours" 
          value="9.2h" 
          icon={Timer} 
          color="text-purple-600"
          trend="+0.3h this week"
        />
        <StatCard 
          title="Fraud Alerts" 
          value="1" 
          icon={AlertTriangle} 
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-blue-600" size={20} />
            Live Employee Status
          </h3>
          <div className="space-y-3">
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
                    {emp.status.replace('-', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">{emp.lastAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="text-red-600" size={20} />
            Fraud Detection Alerts
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-600" size={16} />
                <span className="font-medium text-red-800">High Risk Activity</span>
              </div>
              <p className="text-sm text-red-700">Mike Johnson - Unusual location pattern detected</p>
              <p className="text-xs text-red-600 mt-1">Risk Score: 8/10</p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-yellow-600" size={16} />
                <span className="font-medium text-yellow-800">Medium Risk Activity</span>
              </div>
              <p className="text-sm text-yellow-700">Time pattern analysis shows potential buddy punching</p>
              <p className="text-xs text-yellow-600 mt-1">Risk Score: 5/10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCheckInOut = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Employee Check In/Out</h2>
        <p className="text-gray-600">Secure biometric and location-verified attendance</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-lg text-gray-600">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Camera className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Facial Recognition</h3>
            <p className="text-gray-600 mb-4">Position your face in the camera frame</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Start Camera
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Fingerprint className="text-blue-600" size={24} />
                <h4 className="font-medium text-gray-800">Biometric Verification</h4>
              </div>
              <button
                onClick={simulateBiometricScan}
                disabled={biometricScanning}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  biometricScanning
                    ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {biometricScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700"></div>
                    Scanning...
                  </span>
                ) : (
                  'Scan Fingerprint'
                )}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="text-purple-600" size={24} />
                <h4 className="font-medium text-gray-800">Location Verification</h4>
              </div>
              <button
                onClick={requestLocation}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  locationPermission
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {locationPermission ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    Location Verified
                  </span>
                ) : (
                  'Verify Location'
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <CheckCircle size={20} />
              Check In
            </button>
            <button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center justify-center gap-2">
              <XCircle size={20} />
              Check Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Reports</h2>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Export CSV
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Daily Attendance - May 30, 2025</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Risk</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {record.employee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{record.employee}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkIn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hours}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFraudRiskColor(record.fraudScore)}`}>
                      {getFraudRiskText(record.fraudScore)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Staff Attendance Management
          </h1>
          <p className="text-gray-600">Track employee attendance with anti-fraud protection</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-50 rounded-lg border border-gray-200">
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
            icon={Clock} 
            active={activeTab === 'checkin'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="reports" 
            label="Reports" 
            icon={Calendar} 
            active={activeTab === 'reports'} 
            onClick={setActiveTab} 
          />
        </div>

        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'checkin' && renderCheckInOut()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;