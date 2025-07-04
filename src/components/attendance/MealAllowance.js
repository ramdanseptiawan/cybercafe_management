import React, { useState, useEffect } from 'react';
import { 
  getMealAllowancePreview, 
  getMyMealAllowances 
} from '../../services/mealAllowanceService';
import './MealAllowance.css';

const MealAllowance = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [claims, setClaims] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
      
      // Fetch preview data
      const previewResponse = await getMealAllowancePreview(selectedMonth, selectedYear);
      console.log('Preview response:', previewResponse);
      
      if (previewResponse && previewResponse.success) {
        setPreview(previewResponse.data);
      } else {
        setPreview(null);
      }
      
      // Fetch claims data
      const claimsResponse = await getMyMealAllowances();
      console.log('Claims response:', claimsResponse);
      
      if (claimsResponse && claimsResponse.success) {
        setClaims(claimsResponse.data.claims || []);
      } else {
        setClaims([]);
      }
      
    } catch (err) {
      console.error('Error fetching meal allowance data:', err);
      setError('Gagal memuat data tunjangan makan');
      setPreview(null);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Menunggu', class: 'status-pending' },
      approved: { label: 'Disetujui', class: 'status-approved' },
      rejected: { label: 'Ditolak', class: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || { label: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="meal-allowance-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data tunjangan makan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-allowance-container">
      <div className="meal-allowance-header">
        <h2>Tunjangan Makan</h2>
        <p>Kelola klaim tunjangan makan bulanan Anda</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Month/Year Selector */}
      <div className="period-selector">
        <div className="selector-group">
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
        
        <div className="selector-group">
          <label>Tahun:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview Section */}
      <div className="preview-section">
        <h3>Ringkasan Tunjangan Makan</h3>
        
        {preview ? (
          <div className="preview-card">
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-label">Total Kehadiran:</span>
                <span className="stat-value">{preview.total_attendance || 0} hari</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Kehadiran Valid:</span>
                <span className="stat-value">{preview.valid_attendance || 0} hari</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Tarif per Hari:</span>
                <span className="stat-value">{formatCurrency(preview.amount_per_day || 0)}</span>
              </div>
              
              <div className="stat-item total">
                <span className="stat-label">Total Tunjangan:</span>
                <span className="stat-value">{formatCurrency(preview.total_amount || 0)}</span>
              </div>
            </div>
            
            <div className="preview-status">
              {preview.already_claimed ? (
                <div className="claim-status">
                  <i className="fas fa-check-circle"></i>
                  <span>Status: {getStatusBadge(preview.claim_status)}</span>
                </div>
              ) : (
                <div className="claim-status">
                  <i className="fas fa-clock"></i>
                  <span>Status: Belum diklaim</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-preview">
            <i className="fas fa-calendar-times"></i>
            <p>Tidak ada data kehadiran untuk periode yang dipilih</p>
          </div>
        )}
      </div>



      {/* Claims History */}
      <div className="claims-history">
        <h3>Riwayat Klaim</h3>
        
        {claims.length > 0 ? (
          <div className="claims-table">
            <table>
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Kehadiran Valid</th>
                  <th>Total Klaim</th>
                  <th>Status</th>
                  <th>Tanggal Klaim</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      {months.find(m => m.value === claim.month)?.label} {claim.year}
                    </td>
                    <td>{claim.valid_attendance} hari</td>
                    <td>{formatCurrency(claim.total_amount)}</td>
                    <td>{getStatusBadge(claim.status)}</td>
                    <td>{formatDate(claim.claim_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-claims">
            <i className="fas fa-history"></i>
            <p>Belum ada riwayat klaim tunjangan makan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealAllowance;