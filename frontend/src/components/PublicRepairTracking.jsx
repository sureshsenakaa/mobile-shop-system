import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

const PublicRepairTracking = () => {
    const [ticket, setTicket] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('ticket');
        if (t) {
            setTicket(t);
            fetchStatus(t);
        }
    }, []);

    const fetchStatus = async (ticketNumber) => {
        if (!ticketNumber) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/public/repair/${ticketNumber}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Ticket not found');
            }
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleCheck = (e) => {
        e.preventDefault();
        fetchStatus(ticket);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Complete': return '#4caf50'; 
            case 'Waiting Parts': return '#ff9800';
            default: return '#2196f3'; // Pending
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            <h2 style={{ textAlign: 'center', color: '#673ab7', marginBottom: 20 }}>🔧 Repair Status Tracking</h2>
            <form onSubmit={handleCheck} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input 
                    type="text" 
                    value={ticket} 
                    onChange={e => setTicket(e.target.value)} 
                    placeholder="Enter Repair Ticket Number"
                    style={{ flex: 1, padding: '12px', fontSize: 16, borderRadius: '8px', border: '1px solid #ddd' }}
                    required 
                />
                <button type="submit" style={{ padding: '12px 24px', fontSize: 16, borderRadius: '8px', background: '#673ab7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? 'Searching...' : 'Track'}
                </button>
            </form>

            {error && <div style={{ padding: 15, background: '#ffebee', color: '#c62828', borderRadius: 8, textAlign: 'center' }}>{error}</div>}

            {result && (
                <div style={{ padding: 24, background: '#f5f7fa', borderRadius: 12, border: '1px solid #e4e8ec' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Current Status</div>
                        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 20, backgroundColor: getStatusColor(result.status), color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                            {result.status}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, background: '#fff', padding: 20, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                            <span style={{ color: '#666' }}>Ticket Number</span>
                            <strong>{result.repairId}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                            <span style={{ color: '#666' }}>Device</span>
                            <strong>{result.brand} {result.device}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                            <span style={{ color: '#666' }}>Issue</span>
                            <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{result.issue}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Estimated Cost</span>
                            <strong>Rs. {result.cost}</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicRepairTracking;
