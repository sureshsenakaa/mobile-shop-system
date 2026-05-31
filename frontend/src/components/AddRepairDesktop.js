import React, { useState, useEffect } from 'react';
import { createRepair } from '../api/repairApi';
import { getCustomers } from '../api/customerApi';

const AddRepairDesktop = ({ onRepairAdded, onCancel }) => {
    const [form, setForm] = useState({ customerName: '', customerMobile: '', customerId: '', device: '', issue: '', cost: '', status: 'Pending' });
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            const data = await getCustomers();
            setCustomers(data);
        };
        fetchCustomers();
    }, []);

    const getCustomerFullName = (c) => {
        if (!c) return '';
        if (c.name) return c.name;
        const first = c.firstName || '';
        const last = c.lastName || '';
        return (first + ' ' + last).trim();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, cost: parseFloat(form.cost) || 0 };
            await createRepair(payload);
            onRepairAdded();
        } catch (error) {
            console.error('createRepair error', error);
            alert('Failed to create repair ticket.');
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '8px 0 20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>New Repair Ticket</h2>
            <form onSubmit={handleSubmit}>
                <label style={{ fontWeight: 'bold', color: '#555' }}>Customer Mobile</label>
                <select
                    required
                    style={inputStyle}
                    value={form.customerMobile}
                    onChange={e => {
                        const selectedMobile = e.target.value;
                        const selectedCustomer = customers.find(c => c.mobile === selectedMobile);
                        setForm({
                            ...form,
                            customerMobile: selectedMobile,
                            customerId: selectedCustomer ? selectedCustomer._id : '',
                            customerName: selectedCustomer ? getCustomerFullName(selectedCustomer) : ''
                        });
                    }}
                >
                    <option value="">Select mobile number</option>
                    {customers.map(c => (
                        <option key={c._id} value={c.mobile}>{c.mobile} - {getCustomerFullName(c)}</option>
                    ))}
                </select>
                
                <label style={{ fontWeight: 'bold', color: '#555' }}>Customer Name</label>
                <input required style={inputStyle} placeholder="John Doe" value={form.customerName} readOnly />

                <label style={{ fontWeight: 'bold', color: '#555' }}>Device Model</label>
                <input required style={inputStyle} placeholder="e.g., Samsung S21 (Cracked Screen)" value={form.device} onChange={e => setForm({...form, device: e.target.value})} />
                
                <label style={{ fontWeight: 'bold', color: '#555' }}>Issue Description</label>
                <textarea required style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="Describe the fault..." value={form.issue} onChange={e => setForm({...form, issue: e.target.value})} />

                <label style={{ fontWeight: 'bold', color: '#555' }}>Estimated Cost (Rs.)</label>
                <input required type="number" style={inputStyle} placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: '#ff9800', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Create Ticket</button>
                </div>
            </form>
        </div>
    );
};

export default AddRepairDesktop;