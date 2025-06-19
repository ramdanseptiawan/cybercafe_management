import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import AttendanceDashboard from './components/attendance/AttendanceDashboard';
// Import other components as needed

function App() {
  // User authentication state
  const [isAdmin, setIsAdmin] = useState(true);
  
  // Other state variables will go here
  
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar isAdmin={isAdmin} />
        
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<AttendanceDashboard />} />
            {/* Add more routes as you develop the features */}
            {/* <Route path="/computers" element={<ComputerManagement />} /> */}
            {/* <Route path="/sessions" element={<SessionManagement />} /> */}
            {/* <Route path="/customers" element={<CustomerManagement />} /> */}
            {/* <Route path="/membership" element={<MembershipManagement />} /> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;