import React, { useState, useEffect } from 'react';
import { getSuppliers, deleteSupplier } from '../api/supplierApi';

const SupplierListDesktop = ({ onAddClick }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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
  const containerStyle = { maxWidth: 1000, margin: '20px auto', padding: 30, borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: '#fff', fontFamily: 'Roboto, sans-serif' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
  const thStyle = { padding: '12px 8px', borderBottom: '2px solid #ddd', textAlign: 'left', backgroundColor: '#e8f5e9', color: '#388e3c', fontSize: 14 };
  const tdStyle = { padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: 14 };
  const inputStyle = { padding: 10, width: '300px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 };
  const actionButtonStyle = { padding: '6px 10px', margin: '0 4px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' };

  // --- Functions ---

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Edit removed: editing via inline prompts disabled per request

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
    (supplier.accountNumber && supplier.accountNumber.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: 1000, margin: '20px auto' }}>
        <h2 style={{ color: '#388e3c', textAlign: 'center' }}>Loading suppliers...</h2>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 1000, margin: '20px auto' }}>
      <h2 style={{ color: '#388e3c', marginBottom: 20, borderBottom: '2px solid #388e3c', paddingBottom: 10 }}>
        🚚 Supplier Records
      </h2>
      
      {/* Search Bar and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by ID, Name, or Phone..."
          value={searchTerm}
          onChange={handleSearch}
          className="input"
          style={{ width: 300 }}
        />
        <button className="btn btn-accent" onClick={onAddClick}>+ Add New Supplier</button>
      </div>

      {/* Supplier Table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{...thStyle, width: '8%'}}># ID</th>
            <th style={{...thStyle, width: '30%'}}>Supplier Name</th>
            <th style={{...thStyle, width: '18%'}}>Phone</th>
            <th style={{...thStyle, width: '20%'}}>Account No.</th>
            <th style={{...thStyle, width: '19%'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSuppliers.map((supplier, index) => (
            <tr key={supplier._id}>
              <td style={{...tdStyle, fontWeight: 'bold', color: '#388e3c'}}>{index + 1}</td>
              <td style={tdStyle}>{supplier.name}</td>
              <td style={tdStyle}>{supplier.phone || 'N/A'}</td>
              <td style={tdStyle}>{supplier.accountNumber || 'N/A'}</td>
              <td style={tdStyle}>
                <button 
                  style={{ ...actionButtonStyle, backgroundColor: '#f44336', color: 'white' }} 
                  onClick={() => handleDelete(supplier._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredSuppliers.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 30, color: '#999' }}>No suppliers found matching "{searchTerm}".</p>
      )}
    </div>
  );
};

export default SupplierListDesktop;