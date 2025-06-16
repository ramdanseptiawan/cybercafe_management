import React, { useState, useEffect } from 'react';
import { 
  getMealAllowancePreview, 
  claimMealAllowance, 
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
  const [claimNotes, setClaimNotes] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

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

  const handleClaim = async () => {
    if (!preview || !preview.can_claim) {
      alert('Tidak dapat mengajukan klaim untuk bulan ini');
      return;
    }

    try {
      setClaiming(true);
      setError(null);
      
      const claimData = {
        month: selectedMonth,
        year: selectedYear,
        notes: claimNotes
      };
      
      console.log('Claiming with data:', claimData);
      
      const response = await claimMealAllowance(claimData);
      console.log('Claim response:', response);
      
      if (response && response.success) {
        alert('Klaim tunjangan makan berhasil diajukan!');
        setClaimNotes('');
        setShowClaimForm(false);
        await fetchData(); // Refresh data
      } else {
        throw new Error(response?.message || 'Gagal mengajukan klaim');
      }
      
    } catch (err) {
      console.error('Error claiming meal allowance:', err);
      setError(err.message || 'Gagal mengajukan klaim tunjangan makan');
    } finally {
      setClaiming(false);
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
            
            <div className="preview-actions">
              {preview.already_claimed ? (
                <div className="claim-status">
                  <i className="fas fa-check-circle"></i>
                  <span>Sudah diklaim - Status: {getStatusBadge(preview.claim_status)}</span>
                </div>
              ) : preview.can_claim ? (
                <button 
                  className="btn-claim"
                  onClick={() => setShowClaimForm(true)}
                  disabled={claiming}
                >
                  <i className="fas fa-hand-holding-usd"></i>
                  Ajukan Klaim
                </button>
              ) : (
                <div className="cannot-claim">
                  <i className="fas fa-info-circle"></i>
                  <span>Tidak dapat mengajukan klaim untuk periode ini</span>
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

      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="modal-overlay">
          <div className="claim-form-modal">
            <div className="modal-header">
              <h3>Ajukan Klaim Tunjangan Makan</h3>
              <button 
                className="close-btn"
                onClick={() => setShowClaimForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="claim-summary">
                <p><strong>Periode:</strong> {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                <p><strong>Kehadiran Valid:</strong> {preview?.valid_attendance || 0} hari</p>
                <p><strong>Total Klaim:</strong> {formatCurrency(preview?.total_amount || 0)}</p>
              </div>
              
              <div className="form-group">
                <label>Catatan (Opsional):</label>
                <textarea
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk klaim ini..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowClaimForm(false)}
                disabled={claiming}
              >
                Batal
              </button>
              <button 
                className="btn-submit"
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Mengajukan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Ajukan Klaim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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