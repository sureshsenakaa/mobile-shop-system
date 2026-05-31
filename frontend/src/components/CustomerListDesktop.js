import React, { useState, useEffect } from 'react';
import { getCustomers } from '../api/customerApi';

const CustomerListDesktop = ({ onAddClick }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);
  
  // --- Styling Constants ---
  const containerStyle = { maxWidth: 1000, margin: '20px auto', padding: 30, borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', backgroundColor: '#fff', fontFamily: 'Roboto, sans-serif' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: 20 };
  const thStyle = { padding: '12px 8px', borderBottom: '2px solid #ddd', textAlign: 'left', backgroundColor: '#e3f2fd', color: '#0d47a1', fontSize: 14 };
  const tdStyle = { padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'left', fontSize: 14 };
  const inputStyle = { padding: 10, width: '300px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 };
  const actionButtonStyle = { padding: '6px 10px', margin: '0 4px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' };

  // --- Functions ---

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  

  const { deleteCustomer } = require('../api/customerApi');
  const handleDelete = async (_id) => {
    const customer = customers.find(c => c._id === _id);
    const name = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';
    if (window.confirm(`Are you sure you want to delete Customer ${name}?`)) {
      try {
        await deleteCustomer(_id);
        // Refresh customer list
        const data = await getCustomers();
        setCustomers(data);
        alert(`Customer ${name} deleted.`);
      } catch (err) {
        alert('Failed to delete customer');
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer._id && customer._id.toString().includes(searchTerm))
  );

  return (
    <div className="card" style={{ maxWidth: 1000, margin: '20px auto' }}>
      <h2 style={{ color: '#0d47a1', marginBottom: 20, borderBottom: '2px solid #0d47a1', paddingBottom: 10 }}>
        🧑‍🤝‍🧑 Customer Records
      </h2>
      
      {/* Search Bar and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by ID, Name, or Mobile..."
          value={searchTerm}
          onChange={handleSearch}
          className="input"
          style={{ width: 300 }}
        />
        <button className="btn btn-primary" onClick={onAddClick}>+ Add New Customer</button>
      </div>

      {/* Customer Table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{...thStyle, width: '8%'}}># ID</th>
            <th style={{...thStyle, width: '20%'}}>Full Name</th>
            <th style={{...thStyle, width: '15%'}}>Mobile</th>
            <th style={{...thStyle, width: '30%'}}>Email</th>
            <th style={{...thStyle, width: '22%'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr key={customer._id}>
              <td style={{...tdStyle, fontWeight: 'bold', color: '#0d47a1'}}>{customer._id}</td>
              <td style={tdStyle}>{customer.firstName} {customer.lastName}</td>
              <td style={tdStyle}>{customer.mobile}</td>
              <td style={tdStyle}>{customer.email}</td>
              
              <td style={tdStyle}>
                
                <button 
                  style={{ ...actionButtonStyle, backgroundColor: '#f44336', color: 'white' }} 
                  onClick={() => handleDelete(customer._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCustomers.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 30, color: '#999' }}>No customers found matching "{searchTerm}".</p>
      )}

      
    </div>
  );
};

export default CustomerListDesktop;