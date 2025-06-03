import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Image, Filter } from 'lucide-react';

const IndividualHistory = ({ attendanceRecords, currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRecord, setSelectedRecord] = useState(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const filteredRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'absent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'active': return 'Aktif';
      case 'late': return 'Terlambat';
      case 'absent': return 'Tidak Hadir';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <span className="text-gray-700 font-medium">Filter:</span>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {months.map((month, index) => (
            <option key={index} value={index}>{month}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={2025}>2025</option>
          <option value={2024}>2024</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredRecords.filter(r => r.status === 'present').length}
          </div>
          <div className="text-green-700 font-medium">Hari Hadir</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredRecords.filter(r => r.status === 'late').length}
          </div>
          <div className="text-yellow-700 font-medium">Hari Terlambat</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {filteredRecords.filter(r => r.status === 'absent').length}
          </div>
          <div className="text-red-700 font-medium">Hari Tidak Hadir</div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>Tidak ada data absensi untuk bulan ini</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-800">
                      {formatDate(record.date)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Masuk: {record.checkIn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Keluar: {record.checkOut}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Total: {record.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{record.location}</span>
                    </div>
                  </div>
                </div>
                
                {/* Tampilkan foto check-in dan check-out */}
                <div className="ml-4 flex gap-2">
                  {record.checkInPhoto && (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-green-200">
                        <img
                          src={record.checkInPhoto}
                          alt="Foto check-in"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-green-600 mt-1 block">Masuk</span>
                    </div>
                  )}
                  {record.checkOutPhoto && (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-red-200">
                        <img
                          src={record.checkOutPhoto}
                          alt="Foto check-out"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-red-600 mt-1 block">Keluar</span>
                    </div>
                  )}
                  {/* Fallback untuk foto lama */}
                  {!record.checkInPhoto && !record.checkOutPhoto && record.photo && (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={record.photo}
                          alt="Foto absensi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Photo Modal - Diperbaiki untuk mobile */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Detail Absensi</h3>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-xl text-gray-500 hover:text-gray-700">✕</span>
                </button>
              </div>
            </div>
            
            {/* Content Modal */}
            <div className="p-6 space-y-6">
              {/* Tanggal dan Status */}
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-800 mb-2">
                  {formatDate(selectedRecord.date)}
                </h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                  {getStatusText(selectedRecord.status)}
                </span>
              </div>
              
              {/* Foto Section - Responsif untuk mobile */}
              <div className="space-y-4">
                {selectedRecord.checkInPhoto && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                      <Clock size={16} />
                      Foto Check-in - {selectedRecord.checkIn}
                    </h4>
                    <div className="flex justify-center">
                      <img
                        src={selectedRecord.checkInPhoto}
                        alt="Foto check-in"
                        className="w-full max-w-sm rounded-lg border-2 border-green-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}
                
                {selectedRecord.checkOutPhoto && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                      <Clock size={16} />
                      Foto Check-out - {selectedRecord.checkOut}
                    </h4>
                    <div className="flex justify-center">
                      <img
                        src={selectedRecord.checkOutPhoto}
                        alt="Foto check-out"
                        className="w-full max-w-sm rounded-lg border-2 border-red-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}
                
                {/* Fallback untuk foto lama */}
                {!selectedRecord.checkInPhoto && !selectedRecord.checkOutPhoto && selectedRecord.photo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Foto Absensi</h4>
                    <div className="flex justify-center">
                      <img
                        src={selectedRecord.photo}
                        alt="Foto absensi"
                        className="w-full max-w-sm rounded-lg border-2 border-gray-300 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Detail Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Detail</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock size={14} />
                      Check-in:
                    </span>
                    <span className="font-medium text-green-600">{selectedRecord.checkIn}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock size={14} />
                      Check-out:
                    </span>
                    <span className="font-medium text-red-600">{selectedRecord.checkOut}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock size={14} />
                      Total Jam:
                    </span>
                    <span className="font-medium text-blue-600">{selectedRecord.hours}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <MapPin size={14} />
                      Lokasi:
                    </span>
                    <span className="font-medium text-gray-800">{selectedRecord.location}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Modal */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualHistory;