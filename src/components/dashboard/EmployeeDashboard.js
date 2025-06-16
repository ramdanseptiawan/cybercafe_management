import React, { useState, useEffect } from 'react';
import { Clock, Clipboard, CheckCircle, AlertCircle, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

const EmployeeDashboard = ({ 
  user,
  setActiveTab
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getEmployeeDashboard();
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { today_attendance, meal_allowance, monthly_stats, recent_activities } = dashboardData || {};
  
  // Calculate meal allowance stats
  const totalMealAllowance = meal_allowance?.total_amount || 0;
  const usedMealAllowance = meal_allowance?.used_amount || 0;
  const remainingMealAllowance = meal_allowance?.remaining_amount || 0;
  const attendanceThisMonth = meal_allowance?.attendance_count || 0;
  
  // Today's attendance data
  const todayCheckedIn = today_attendance?.checked_in || false;
  const todayCheckedOut = today_attendance?.checked_out || false;
  const checkInTime = today_attendance?.check_in_time ? new Date(today_attendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
  const checkOutTime = today_attendance?.check_out_time ? new Date(today_attendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
  const workingHours = today_attendance?.working_hours || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome Back, {user?.name}!</h1>
        <p className="text-blue-100">Department: {user?.department}</p>
        <p className="text-blue-100">Here&apos;s your daily overview</p>
      </div>

      {/* Quick Actions - Attendance & Meal Allowance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">My Attendance</h3>
            <Clipboard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Today&apos;s Status:</span>
              <span className={`font-medium ${
                todayCheckedIn ? 'text-green-600' : 'text-red-600'
              }`}>
                {todayCheckedIn ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {checkInTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check In:</span>
                <span className="font-medium">{checkInTime}</span>
              </div>
            )}
            {checkOutTime && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check Out:</span>
                <span className="font-medium">{checkOutTime}</span>
              </div>
            )}
            {workingHours > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Working Hours:</span>
                <span className="font-medium text-purple-600">{workingHours.toFixed(1)}h</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">This Month:</span>
              <span className="font-medium text-blue-600">{attendanceThisMonth} days</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('individual-attendance')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Attendance
          </button>
        </div>

        {/* Meal Allowance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Meal Allowance</h3>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total This Month:</span>
              <span className="font-medium text-green-600">Rp {totalMealAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Used:</span>
              <span className="font-medium text-orange-600">Rp {usedMealAllowance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-medium text-blue-600">Rp {remainingMealAllowance.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${totalMealAllowance > 0 ? (usedMealAllowance / totalMealAllowance) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('meal-allowance')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Meal Allowance
          </button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today&apos;s Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayCheckedIn ? '✓' : '✗'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              todayCheckedIn ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {todayCheckedIn ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceThisMonth}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meal Allowance</p>
              <p className="text-2xl font-bold text-gray-900">Rp {(totalMealAllowance / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
              <p className="text-2xl font-bold text-gray-900">Rp {(remainingMealAllowance / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthly_stats?.attendance_rate?.toFixed(1) || 0}%</p>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthly_stats?.present_days || 0}</p>
            <p className="text-sm text-gray-600">Present Days</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthly_stats?.late_days || 0}</p>
            <p className="text-sm text-gray-600">Late Days</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{monthly_stats?.average_work_hours?.toFixed(1) || 0}h</p>
            <p className="text-sm text-gray-600">Avg Work Hours</p>
          </div>
        </div>
      </div>

      {/* Recent Activities & Meal Allowance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activities</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recent_activities && recent_activities.length > 0 ? (
                recent_activities.slice(0, 5).map((activity, index) => {
                  const activityDate = new Date(activity.date).toLocaleDateString('id-ID');
                  const checkInTime = activity.check_in ? new Date(activity.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
                  const checkOutTime = activity.check_out ? new Date(activity.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;
                  
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'present': return 'bg-green-100 text-green-800';
                      case 'late': return 'bg-orange-100 text-orange-800';
                      case 'early_leave': return 'bg-yellow-100 text-yellow-800';
                      case 'not_checked_out': return 'bg-blue-100 text-blue-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };
                  
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-800">{activityDate}</p>
                        <p className="text-sm text-gray-600">
                          {checkInTime && `In: ${checkInTime}`}
                          {checkOutTime && ` | Out: ${checkOutTime}`}
                          {activity.work_hours > 0 && ` | ${activity.work_hours.toFixed(1)}h`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meal Allowance Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Meal Allowance Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Monthly Allocation</p>
                  <p className="text-sm text-gray-600">Based on attendance</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">Rp {totalMealAllowance.toLocaleString()}</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Used Amount</p>
                  <p className="text-sm text-gray-600">Claims processed</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-orange-600">Rp {usedMealAllowance.toLocaleString()}</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    Used
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-800">Remaining Balance</p>
                  <p className="text-sm text-gray-600">Available to claim</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">Rp {remainingMealAllowance.toLocaleString()}</p>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Remaining
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;