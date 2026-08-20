import React, { useState } from 'react';
import { API_BASE_URL } from '../api/config';

const WarrantyCheck = () => {
    const [imei, setImei] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!imei) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/warranty/${imei}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to check warranty');
            }
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 20 }}>🛡️ Warranty Check</h2>
            <form onSubmit={handleCheck} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input 
                    type="text" 
                    value={imei} 
                    onChange={e => setImei(e.target.value)} 
                    placeholder="Enter Device IMEI or Serial Number"
                    style={{ flex: 1, padding: '12px', fontSize: 16, borderRadius: '8px', border: '1px solid #ddd' }}
                    required 
                />
                <button type="submit" style={{ padding: '12px 24px', fontSize: 16, borderRadius: '8px', background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'Checking...' : 'Check Status'}
                </button>
            </form>

            {error && <div style={{ padding: 15, background: '#ffebee', color: '#c62828', borderRadius: 8, textAlign: 'center' }}>{error}</div>}

            {result && (
                <div style={{ padding: 20, background: result.hasWarranty ? '#e8f5e9' : '#fff3e0', borderRadius: 8, border: result.hasWarranty ? '1px solid #c8e6c9' : '1px solid #ffe0b2' }}>
                    <h3 style={{ marginTop: 0, color: result.hasWarranty ? '#2e7d32' : '#e65100', textAlign: 'center' }}>
                        {result.hasWarranty ? '✅ Warranty Active' : '⚠️ Warranty Expired / Not Found'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
                        {result.saleDate && <div><strong>Purchase Date:</strong> {new Date(result.saleDate).toLocaleDateString()}</div>}
                        {result.expiryDate && <div><strong>Valid Until:</strong> {new Date(result.expiryDate).toLocaleDateString()}</div>}
                        {result.productName && <div><strong>Product:</strong> {result.productName}</div>}
                        {result.customerName && <div><strong>Customer:</strong> {result.customerName}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyCheck;
