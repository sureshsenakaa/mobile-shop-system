import React, { useState, useEffect } from 'react';
import { getSuppliers, deleteSupplier, updateSupplier } from '../api/supplierApi';
import './Supplier.css';

const SupplierListDesktop = ({ onAddClick }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };
  
  // --- Styling Constants ---
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
  const thStyle = { padding: '12px 10px', borderBottom: '2px solid #ddd', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: '600' };
  const tdStyle = { padding: '12px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: 14, verticalAlign: 'top' };
  const inputStyle = { padding: 6, width: '90%', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 4 };
  const actionButtonStyle = { padding: '6px 10px', margin: '0 4px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' };

  // --- Functions ---

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (supplier) => {
    setEditingId(supplier._id || supplier.id);
    setEditData({ 
      ...supplier,
      brands: Array.isArray(supplier.brands) ? supplier.brands.join(', ') : (supplier.brands || ''),
    });
  };

  const handleEditChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleSaveEdit = async () => {
    try {
      const payload = { ...editData };
      if (typeof payload.brands === 'string') {
        payload.brands = payload.brands.split(',').map(b => b.trim()).filter(b => b.length > 0);
      }
      payload.creditLimit = parseFloat(payload.creditLimit || 0);
      payload.outstandingBalance = parseFloat(payload.outstandingBalance || 0);

      await updateSupplier(editingId, payload);
      setEditingId(null);
      await fetchSuppliers();
    } catch (err) {
      alert('Failed to update supplier: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this supplier?`)) {
      try {
        await deleteSupplier(id);
        await fetchSuppliers(); // Refresh the list
        alert('Supplier deleted successfully');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert(error.message || 'Failed to delete supplier');
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier._id && supplier._id.toString().includes(searchTerm)) ||
    (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(searchTerm)) ||
    (supplier.brands && Array.isArray(supplier.brands) && supplier.brands.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="supplier-container">
        <div className="supplier-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#10b981' }}>Loading suppliers...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h1 className="supplier-title">Suppliers & Partners</h1>
          <p className="supplier-subtitle">Manage your inventory sources and financial limits.</p>
        </div>
        <button className="btn-premium btn-primary" onClick={onAddClick}>
          + Add New Supplier
        </button>
      </div>
      
      <div className="supplier-card">
        {/* Search Bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by Name, Phone, or Brand..."
            value={searchTerm}
            onChange={handleSearch}
            className="supplier-search-input"
          />
        </div>

        {/* Supplier Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
            <tr>
              <th style={{...thStyle, width: '25%'}}>Supplier Info & Brands</th>
              <th style={{...thStyle, width: '15%'}}>Contact</th>
              <th style={{...thStyle, width: '15%'}}>Warranty Terms</th>
              <th style={{...thStyle, width: '25%'}}>Financials</th>
              <th style={{...thStyle, width: '20%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((supplier) => {
              const id = supplier._id || supplier.id;
              const isEditing = editingId === id;

              // Compute financial status
              const limit = Number(supplier.creditLimit || 0);
              const balance = Number(supplier.outstandingBalance || 0);
              const isOverLimit = limit > 0 && balance >= limit;
              const balanceColor = isOverLimit ? '#ef4444' : (balance > 0 ? '#f59e0b' : '#10b981');

              return (
              <tr key={id}>
                {isEditing ? (
                  <>
                    <td style={tdStyle}>
                      <input type="text" placeholder="Name" value={editData.name || ''} onChange={(e) => handleEditChange(e, 'name')} style={inputStyle} />
                      <input type="text" placeholder="Brands (comma separated)" value={editData.brands || ''} onChange={(e) => handleEditChange(e, 'brands')} style={inputStyle} />
                    </td>
                    <td style={tdStyle}>
                      <input type="text" placeholder="Phone" value={editData.phone || ''} onChange={(e) => handleEditChange(e, 'phone')} style={inputStyle} />
                      <input type="text" placeholder="Email" value={editData.email || ''} onChange={(e) => handleEditChange(e, 'email')} style={inputStyle} />
                    </td>
                    <td style={tdStyle}>
                      <input type="text" placeholder="Warranty" value={editData.warrantyTerms || ''} onChange={(e) => handleEditChange(e, 'warrantyTerms')} style={inputStyle} />
                    </td>
                    <td style={tdStyle}>
                      <label style={{fontSize:11}}>Credit Limit:</label>
                      <input type="number" placeholder="Limit" value={editData.creditLimit || ''} onChange={(e) => handleEditChange(e, 'creditLimit')} style={inputStyle} />
                      <label style={{fontSize:11}}>Balance:</label>
                      <input type="number" placeholder="Balance" value={editData.outstandingBalance || ''} onChange={(e) => handleEditChange(e, 'outstandingBalance')} style={inputStyle} />
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>
                      <strong style={{ fontSize: 16, color: '#1e293b' }}>{supplier.name}</strong>
                      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {supplier.categories && Array.isArray(supplier.categories) && supplier.categories.map(c => (
                           <span key={c} className="supplier-tag tag-category">{c}</span>
                        ))}
                        {supplier.brands && Array.isArray(supplier.brands) && supplier.brands.map(b => (
                           <span key={b} className="supplier-tag tag-brand">{b}</span>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: '#334155' }}>📞 {supplier.phone || '-'}</div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{supplier.email || ''}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#475569', fontSize: 13 }}>{supplier.warrantyTerms || 'Not specified'}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>Owed:</span>
                        <strong style={{ color: balanceColor }}>{formatCurrency(balance)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>Limit:</span>
                        <span style={{ fontSize: 13 }}>{limit > 0 ? formatCurrency(limit) : 'None'}</span>
                      </div>
                      {limit > 0 && (
                        <div style={{ width: '100%', height: 4, background: '#e2e8f0', marginTop: 6, borderRadius: 2 }}>
                           <div style={{ width: `${Math.min((balance/limit)*100, 100)}%`, height: '100%', background: balanceColor, borderRadius: 2 }}></div>
                        </div>
                      )}
                    </td>
                  </>
                )}
                <td style={tdStyle}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button className="action-btn btn-save" onClick={handleSaveEdit}>Save</button>
                      <button className="action-btn btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(supplier)}>Edit</button>
                      <button className="action-btn btn-delete" onClick={() => handleDelete(id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {filteredSuppliers.length === 0 && (
        <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No suppliers found.</p>
      )}
      </div>
    </div>
  );
};

export default SupplierListDesktop;