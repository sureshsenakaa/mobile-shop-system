import React, { useState, useEffect } from 'react';
import { getAllSubscriptions, approveSubscription, rejectSubscription } from '../api/subscriptionApi';
import { API_BASE_URL } from '../api/config';

const SubscriptionApprovals = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState(null); // URL for modal

    const loadPayments = async () => {
        setLoading(true);
        try {
            const data = await getAllSubscriptions();
            setPayments(data);
        } catch (err) {
            console.error('Failed to load payments', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const handleApprove = async (id) => {
        const months = prompt("How many months should this shop's subscription be extended?", "1");
        if (months !== null) {
            try {
                await approveSubscription(id, parseInt(months));
                alert('Payment approved and subscription extended.');
                loadPayments();
            } catch (err) {
                alert(err.message || 'Failed to approve payment');
            }
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter a reason for rejection:");
        if (reason !== null) {
            try {
                await rejectSubscription(id, reason);
                alert('Payment rejected.');
                loadPayments();
            } catch (err) {
                alert(err.message || 'Failed to reject payment');
            }
        }
    };

    return (
        <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Subscription Approvals (Super Admin)</h2>
            
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {loading ? <p>Loading...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>ID</th>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Shop</th>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Amount / Ref</th>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Submitted</th>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Status</th>
                                    <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>#{p.id}</td>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                            <strong>{p.Shop ? p.Shop.name : 'Unknown Shop'}</strong><br/>
                                            <span style={{ fontSize: 12, color: '#888' }}>{p.Shop ? p.Shop.ownerName : ''}</span>
                                        </td>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                            Rs. {p.amount}<br/>
                                            <span style={{ fontSize: 12, color: '#888' }}>Ref: {p.referenceNumber}</span>
                                        </td>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee', fontSize: 13 }}>
                                            {new Date(p.dateSubmitted).toLocaleString()}
                                        </td>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: 12, 
                                                fontSize: 12, 
                                                fontWeight: 'bold',
                                                backgroundColor: p.status === 'Approved' ? '#e8f5e9' : (p.status === 'Rejected' ? '#ffebee' : '#fff3e0'),
                                                color: p.status === 'Approved' ? '#2e7d32' : (p.status === 'Rejected' ? '#c62828' : '#e65100')
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                            <button 
                                                className="btn btn-ghost" 
                                                onClick={() => setSelectedSlip(`${API_BASE_URL.replace('/api', '')}${p.slipImageUrl}`)}
                                                style={{ color: '#1976d2', padding: '4px 8px', fontSize: 12, marginRight: 5 }}
                                            >
                                                View Slip
                                            </button>
                                            
                                            {p.status === 'Pending' && (
                                                <>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => handleApprove(p.id)}
                                                        style={{ color: '#2e7d32', padding: '4px 8px', fontSize: 12, marginRight: 5 }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => handleReject(p.id)}
                                                        style={{ color: '#c62828', padding: '4px 8px', fontSize: 12 }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#888' }}>No payments found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slip Modal */}
            {selectedSlip && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
                }} onClick={() => setSelectedSlip(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={selectedSlip} alt="Bank Slip" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
                        <button style={{
                            position: 'absolute', top: -15, right: -15, background: '#fff', 
                            border: 'none', borderRadius: '50%', width: 30, height: 30, 
                            cursor: 'pointer', fontWeight: 'bold'
                        }} onClick={(e) => { e.stopPropagation(); setSelectedSlip(null); }}>X</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionApprovals;
