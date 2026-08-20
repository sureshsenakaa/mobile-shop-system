import React, { useState, useEffect } from 'react';
import { getCustomers, updateCustomer, deleteCustomer, payCustomerDebt } from '../api/customerApi';
import './Supplier.css'; // Reusing premium styles

const CustomerListDesktop = ({ onAddClick }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [settleDebtCustomer, setSettleDebtCustomer] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Functions ---
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async (_id) => {
    const customer = customers.find(c => (c._id || c.id) === _id);
    const name = customer ? customer.name : 'Unknown';
    if (window.confirm(`Are you sure you want to delete Customer ${name}?`)) {
      try {
        await deleteCustomer(_id);
        await fetchCustomers();
        alert(`Customer ${name} deleted.`);
      } catch (err) {
        alert('Failed to delete customer');
      }
    }
  };

  const handleEditClick = (customer) => {
    setEditingId(customer._id || customer.id);
    setEditData({ ...customer });
  };

  const handleEditChange = (e, field) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  const handleSaveEdit = async () => {
    try {
      const payload = { ...editData };
      payload.outstandingCredit = parseFloat(payload.outstandingCredit || 0);

      await updateCustomer(editingId, payload);
      setEditingId(null);
      await fetchCustomers();
    } catch (err) {
      alert('Failed to update customer: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const filteredCustomers = customers.filter(customer => {
    const id = customer._id || customer.id;
    return (
      (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (id && id.toString().includes(searchTerm))
    );
  });

  const handleSettleDebt = async () => {
    if (!settleAmount || settleAmount <= 0) return alert('Enter a valid amount');
    try {
        await payCustomerDebt(settleDebtCustomer._id || settleDebtCustomer.id, parseFloat(settleAmount));
        alert('Debt settled successfully!');
        setSettleDebtCustomer(null);
        setSettleAmount('');
        await fetchCustomers();
    } catch (err) {
        alert('Failed to settle debt: ' + (err.message || 'Unknown error'));
    }
  };

  const formatCurrency = (val) => {
    return 'Rs. ' + Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTypeStyle = (type) => {
    switch (type) {
        case 'VIP': return { background: '#fef08a', color: '#854d0e', border: '1px solid #fde047' };
        case 'Wholesale': return { background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' };
        default: return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  if (loading) {
    return (
      <div className="supplier-container">
        <div className="supplier-card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#0ea5e9' }}>Loading customers...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div>
          <h1 className="supplier-title" style={{ color: '#0f172a' }}>Customer CRM</h1>
          <p className="supplier-subtitle">Manage customer profiles, loyalty points, and credit limits.</p>
        </div>
        <button className="btn-premium btn-primary" style={{ backgroundColor: '#0284c7' }} onClick={onAddClick}>
          + Add New Customer
        </button>
      </div>
      
      <div className="supplier-card">
        {/* Search Bar */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by Name, Mobile, or ID..."
            value={searchTerm}
            onChange={handleSearch}
            className="supplier-search-input"
          />
        </div>

        {/* Customer Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Customer Profile</th>
                <th style={{ width: '20%' }}>Contact Info</th>
                <th style={{ width: '15%' }}>Device / Notes</th>
                <th style={{ width: '25%' }}>Status & Financials</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const id = customer._id || customer.id;
                const isEditing = editingId === id;
                const balance = Number(customer.outstandingCredit || 0);

                return (
                <tr key={id}>
                  {isEditing ? (
                    <>
                      <td>
                        <input type="text" placeholder="Full Name" value={editData.name || ''} onChange={(e) => handleEditChange(e, 'name')} className="form-input" style={{ marginBottom: 4 }} />
                        <select className="form-input" value={editData.customerType || 'Regular'} onChange={(e) => handleEditChange(e, 'customerType')}>
                            <option value="Regular">Regular</option>
                            <option value="VIP">VIP</option>
                            <option value="Wholesale">Wholesale</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" placeholder="Mobile" value={editData.mobile || ''} onChange={(e) => handleEditChange(e, 'mobile')} className="form-input" style={{ marginBottom: 4 }} />
                      </td>
                      <td>
                        <input type="text" placeholder="Device (e.g iPhone 13)" value={editData.deviceNotes || ''} onChange={(e) => handleEditChange(e, 'deviceNotes')} className="form-input" />
                      </td>
                      <td>
                        <label style={{ fontSize: 11 }}>Credit (Rs.):</label>
                        <input type="number" placeholder="Credit Owed" value={editData.outstandingCredit || 0} onChange={(e) => handleEditChange(e, 'outstandingCredit')} className="form-input" />
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong style={{ fontSize: 16, color: '#1e293b', display: 'block' }}>{customer.name}</strong>
                        <div style={{ marginTop: 6 }}>
                          <span className="supplier-tag" style={getTypeStyle(customer.customerType || 'Regular')}>
                            {customer.customerType || 'Regular'}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>ID: {id}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: '#334155', fontWeight: '500' }}>📞 {customer.mobile || '-'}</div>
                      </td>
                      <td>
                        <div style={{ color: '#475569', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                            📱 {customer.deviceNotes || <span style={{ color: '#cbd5e1' }}>Not specified</span>}
                        </div>
                      </td>
                      <td>
                        {balance > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fee2e2', padding: '4px 8px', borderRadius: 6 }}>
                              <span style={{ color: '#991b1b', fontSize: 12, fontWeight: 600 }}>Naya (Credit):</span>
                              <strong style={{ color: '#dc2626' }}>{formatCurrency(balance)}</strong>
                            </div>
                            <button className="btn-ghost" style={{ fontSize: 12, padding: '2px 4px', color: '#0284c7' }} onClick={() => setSettleDebtCustomer(customer)}>
                                Settle Debt
                            </button>
                          </div>
                        )}
                        {balance <= 0 && (
                          <div style={{ color: '#10b981', fontSize: 12, fontWeight: 600, padding: '4px 8px' }}>
                            No Outstanding Credit
                          </div>
                        )}
                      </td>
                    </>
                  )}
                  <td>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button className="action-btn btn-save" onClick={handleSaveEdit}>Save</button>
                        <button className="action-btn btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button className="action-btn btn-edit" onClick={() => handleEditClick(customer)}>Edit</button>
                        <button className="action-btn btn-delete" onClick={() => handleDelete(id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>No customers found matching "{searchTerm}".</p>
          </div>
        )}
      </div>

      {settleDebtCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, width: 350, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a' }}>Settle Debt</h3>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                    Customer: <strong>{settleDebtCustomer.name}</strong><br/>
                    Outstanding: <strong style={{ color: '#dc2626' }}>{formatCurrency(settleDebtCustomer.outstandingCredit)}</strong>
                </p>
                <div style={{ marginTop: 15 }}>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Payment Amount (Rs.)</label>
                    <input type="number" className="form-input" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} max={settleDebtCustomer.outstandingCredit} min="1" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                    <button className="btn-ghost" onClick={() => setSettleDebtCustomer(null)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSettleDebt}>Confirm Payment</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListDesktop;