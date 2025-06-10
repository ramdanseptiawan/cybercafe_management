import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Save, X, Map, Clock, Users, Building, Home, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import untuk Leaflet components agar tidak di-render di server
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const useMapEvents = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMapEvents),
  { ssr: false }
);

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 100,
    type: 'office',
    working_hours: {
      start: '08:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5] // Monday to Friday
    },
    timezone: 'Asia/Jakarta',
    is_active: true
  });

  const locationTypes = [
    { value: 'office', label: 'Office', icon: Building, color: 'bg-blue-100 text-blue-800' },
    { value: 'branch', label: 'Branch', icon: Building, color: 'bg-green-100 text-green-800' },
    { value: 'client_site', label: 'Client Site', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { value: 'remote', label: 'Remote', icon: Home, color: 'bg-orange-100 text-orange-800' }
  ];

  useEffect(() => {
    setIsClient(true);
    loadLocations();
  }, []);

  // Setup Leaflet icons hanya di client side
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, [isClient]);

  const parseWorkingHours = (workingHoursStr) => {
    try {
      if (typeof workingHoursStr === 'string') {
        return JSON.parse(workingHoursStr);
      }
      return workingHoursStr;
    } catch (error) {
      return { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5] };
    }
  };

  const formatWorkingDays = (days) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!days || !Array.isArray(days)) return 'Not set';
    return days.map(day => dayNames[day === 7 ? 0 : day]).join(', ');
  };

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const response = await fetch('http://localhost:8080/api/attendance/locations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.success) {
        setLocations(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load locations');
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      setError('Failed to load locations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log('Form data before submit:', formData);
      
      const requestBody = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius),
        type: formData.type,
        working_hours: JSON.stringify(formData.working_hours), // Convert to string
        timezone: formData.timezone,
        is_active: formData.is_active
      };

      console.log('Request body:', requestBody);

      const url = editingLocation 
        ? `http://localhost:8080/api/attendance/locations/${editingLocation.id}`
        : 'http://localhost:8080/api/attendance/locations';
      
      const method = editingLocation ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Success response:', result);
      
      await loadLocations();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving location:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/attendance/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadLocations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Error deleting location: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: 100,
      type: 'office',
      working_hours: {
        start: '08:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5]
      },
      timezone: 'Asia/Jakarta',
      is_active: true
    });
    setEditingLocation(null);
    setSelectedPosition(null);
    setShowMap(false);
  };

  const handleEdit = (location) => {
    const workingHours = parseWorkingHours(location.working_hours);
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: location.radius,
      type: location.type,
      working_hours: workingHours, // Use parsed working hours object
      timezone: location.timezone || 'Asia/Jakarta',
      is_active: location.is_active
    });
    setSelectedPosition([location.latitude, location.longitude]);
    setMapCenter([location.latitude, location.longitude]);
    setShowModal(true);
  };

  // Map Click Handler Component
  const MapClickHandler = () => {
    if (!isClient || typeof useMapEvents !== 'function') return null;
    
    const map = useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
      }
    });
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadLocations}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Location Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage attendance locations and their settings</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Locations</p>
              <p className="text-lg font-semibold text-gray-900">{locations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-lg font-semibold text-gray-900">
                {locations.filter(l => l.is_active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Offices</p>
              <p className="text-lg font-semibold text-gray-900">
                {locations.filter(l => l.type === 'office').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Home className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Remote</p>
              <p className="text-lg font-semibold text-gray-900">
                {locations.filter(l => l.type === 'remote').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations List - Changed from grid to vertical layout */}
      <div className="space-y-4">
        {locations.map((location) => {
          const typeConfig = locationTypes.find(t => t.value === location.type) || locationTypes[0];
          const workingHours = parseWorkingHours(location.working_hours);
          const IconComponent = typeConfig.icon;
          
          return (
            <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${typeConfig.color.replace('text-', 'bg-').replace('800', '100')}`}>
                      <IconComponent className={`h-5 w-5 ${typeConfig.color.replace('bg-', 'text-').replace('100', '600')}`} />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold text-gray-900">{location.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{location.address || 'No address'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{workingHours.start} - {workingHours.end}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Radius: {location.radius}m</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      location.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {location.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Days: {formatWorkingDays(workingHours.days)}</span>
                    <span>Created: {new Date(location.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        
      {locations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first location.</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Add First Location
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {locationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="-6.2088"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="106.8456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Asia/Jakarta"
                  />
                </div>
              </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Kerja
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Jam Mulai</label>
                      <input
                        type="time"
                        value={formData.working_hours.start}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          working_hours: {
                            ...prev.working_hours,
                            start: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Jam Selesai</label>
                      <input
                        type="time"
                        value={formData.working_hours.end}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          working_hours: {
                            ...prev.working_hours,
                            end: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari Kerja
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { value: 0, label: 'Min' },
                      { value: 1, label: 'Sen' },
                      { value: 2, label: 'Sel' },
                      { value: 3, label: 'Rab' },
                      { value: 4, label: 'Kam' },
                      { value: 5, label: 'Jum' },
                      { value: 6, label: 'Sab' }
                    ].map(day => (
                      <label key={day.value} className="flex flex-col items-center">
                        <input
                          type="checkbox"
                          checked={formData.working_hours?.days?.includes(day.value) || false}
                          onChange={(e) => {
                            const days = formData.working_hours?.days || [];
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                working_hours: {
                                  ...prev.working_hours,
                                  days: [...days, day.value].sort()
                                }
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                working_hours: {
                                  ...prev.working_hours,
                                  days: days.filter(d => d !== day.value)
                                }
                              }));
                            }
                          }}
                          className="mb-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-600">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              {/* Map Toggle and Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Map className="h-4 w-4" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Location
                  </label>
                </div>
              </div>

              {/* Map - hanya render di client side */}
              {showMap && isClient && (
                <div className="h-64 border border-gray-300 rounded-lg overflow-hidden">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapClickHandler />
                    {selectedPosition && (
                      <Marker position={selectedPosition}>
                        <Popup>
                          Selected Location<br />
                          Lat: {selectedPosition[0].toFixed(6)}<br />
                          Lng: {selectedPosition[1].toFixed(6)}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingLocation ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;