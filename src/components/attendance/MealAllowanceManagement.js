import React, { useState, useEffect } from 'react';
import { 
  getAllMealAllowances, 
  updateMealAllowanceStatus,
  getMealAllowanceStats 
} from '../../services/mealAllowanceService';
import './MealAllowanceManagement.css';

const MealAllowanceManagement = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [claimsData, statsData] = await Promise.all([
        getAllMealAllowances(selectedMonth, selectedYear),
        getMealAllowanceStats(selectedMonth, selectedYear)
      ]);
      
      setClaims(claimsData.data || []);
      setStats(statsData.data);
    } catch (err) {
      console.error('Error fetching meal allowance data:', err);
      setError('Gagal memuat data tunjangan makan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (claimId, newStatus) => {
    try {
      setUpdating(claimId);
      await updateMealAllowanceStatus(claimId, newStatus);
      
      // Update local state
      setClaims(claims.map(claim => 
        claim.id === claimId 
          ? { ...claim, status: newStatus, updated_at: new Date().toISOString() }
          : claim
      ));
      
      // Refresh stats
      const statsData = await getMealAllowanceStats(selectedMonth, selectedYear);
      setStats(statsData.data);
      
    } catch (err) {
      console.error('Error updating claim status:', err);
      alert('Gagal mengupdate status klaim');
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { class: 'status-pending', text: 'Menunggu' },
      'approved': { class: 'status-approved', text: 'Disetujui' },
      'rejected': { class: 'status-rejected', text: 'Ditolak' }
    };
    
    const config = statusConfig[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') return true;
    return claim.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="meal-allowance-management-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data manajemen tunjangan makan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meal-allowance-management-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">Coba Lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-allowance-management-container">
      <div className="management-header">
        <h2>Manajemen Tunjangan Makan</h2>
        <p>Kelola persetujuan klaim tunjangan makan karyawan</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.total_claims}</h3>
              <p>Total Klaim</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{stats.pending_claims}</h3>
              <p>Menunggu Persetujuan</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.approved_claims}</h3>
              <p>Disetujui</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.total_amount)}</h3>
              <p>Total Nilai</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Bulan:</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Tahun:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="claims-management">
        <h3>Daftar Klaim Tunjangan Makan</h3>
        {filteredClaims.length > 0 ? (
          <div className="claims-table">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tanggal Klaim</th>
                  <th>Periode</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <div className="employee-info">
                        <strong>{claim.user?.name || 'Unknown'}</strong>
                        <small>{claim.user?.email || ''}</small>
                      </div>
                    </td>
                    <td>{new Date(claim.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      {months.find(m => m.value === claim.month)?.label} {claim.year}
                    </td>
                    <td className="amount">{formatCurrency(claim.amount)}</td>
                    <td>{getStatusBadge(claim.status)}</td>
                    <td>{claim.notes || '-'}</td>
                    <td>
                      {claim.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleStatusUpdate(claim.id, 'approved')}
                            disabled={updating === claim.id}
                            className="approve-btn"
                          >
                            {updating === claim.id ? '...' : 'Setujui'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(claim.id, 'rejected')}
                            disabled={updating === claim.id}
                            className="reject-btn"
                          >
                            {updating === claim.id ? '...' : 'Tolak'}
                          </button>
                        </div>
                      )}
                      {claim.status !== 'pending' && (
                        <span className="status-final">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-claims">
            <p>Tidak ada klaim tunjangan makan untuk periode dan filter yang dipilih</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAllowanceManagement;