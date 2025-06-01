"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { individualUsers } from '../../data/initialData'; // Add this import

const Login = () => {
  const router = useRouter();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Mock user data - in a real app, this would come from a database
  // Update the users array around line 26
  const users = [
    { 
      username: 'admin', 
      password: 'admin123', 
      role: 'admin', 
      name: 'Administrator', 
      id: 'ADM001',
      permissions: ['all']
    },
    { 
      username: 'viewer', 
      password: 'viewer123', 
      role: 'viewer', 
      name: 'Viewer User', 
      id: 'VWR001',
      department: 'Management',
      permissions: ['dashboard', 'reports']
    },
    ...individualUsers // Import from initialData
  ];

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const foundUser = users.find(
      user => user.username === credentials.username && user.password === credentials.password
    );
    
    if (foundUser) {
      // Use the login function from AuthContext
      login({
        id: foundUser.id || foundUser.username,
        username: foundUser.username,
        name: foundUser.name || foundUser.username,
        role: foundUser.role,
        department: foundUser.department,
        email: foundUser.email,
        phone: foundUser.phone,
        joinDate: foundUser.joinDate,
        avatar: foundUser.avatar
      });
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 text-black">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <Coffee className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">CyberCafe Manager</h1>
            <p className="text-blue-100 mt-2">Sign in to access your dashboard</p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    className="pl-10 w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    className="pl-10 w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Sign In
                </button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Demo accounts:</p>
                <p className="mt-1">Admin: admin / admin123</p>
                <p>Viewer: viewer / viewer123</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;