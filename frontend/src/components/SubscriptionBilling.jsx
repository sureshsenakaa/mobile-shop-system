import React, { useState, useEffect } from 'react';
import { uploadSubscriptionSlip, getSubscriptionHistory } from '../api/subscriptionApi';
import { getAuthHeader } from '../api/authApi';
import { apiUrl } from '../api/config';

const SubscriptionBilling = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Shop info
    const [shopInfo, setShopInfo] = useState(null);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getSubscriptionHistory();
            setHistory(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const loadShopInfo = async () => {
        try {
            // Need a way to get shop info, I'll fetch it from the currently logged in user info if possible, 
            // or fetch /api/settings/branding which returns shop info
            const res = await fetch(apiUrl('/settings/branding'), { headers: getAuthHeader() });
            const data = await res.json();
            if(data && data.shop) {
                setShopInfo(data.shop);
            }
        } catch (e) {
            console.error(e);
        }
    }

    useEffect(() => {
        loadHistory();
        loadShopInfo();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a bank slip image');

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('amount', amount);
            formData.append('paymentDate', paymentDate);
            formData.append('referenceNumber', referenceNumber);
            formData.append('slipImage', file);

            await uploadSubscriptionSlip(formData);
            
            alert('Bank slip uploaded successfully. It is pending admin approval.');
            
            // Reset form
            setAmount('');
            setReferenceNumber('');
            setFile(null);
            
            // Reload history
            loadHistory();
        } catch (err) {
            alert(err.message || 'Failed to upload slip');
        }
        setSubmitting(false);
    };

    return (
        <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Subscription & Billing</h2>

            {shopInfo && (
                <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
                    <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>Billing Status</h3>
                        <p style={{ 
                            fontSize: 24, 
                            fontWeight: 'bold', 
                            margin: '10px 0 0 0', 
                            color: shopInfo.billingStatus === 'overdue' ? '#c62828' : '#2e7d32' 
                        }}>
                            {shopInfo.billingStatus === 'overdue' ? 'Overdue' : 'Active'}
                        </p>
                    </div>
                    <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>Next Billing Date</h3>
                        <p style={{ fontSize: 24, fontWeight: 'bold', margin: '10px 0 0 0', color: 'var(--primary)' }}>
                            {shopInfo.nextBillingDate ? new Date(shopInfo.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {/* Bank Details & Form */}
                <div style={{ flex: '1 1 350px', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Upload Payment Slip</h3>
                    
                    <div style={{ background: '#f5f7fa', padding: 15, borderRadius: 6, marginBottom: 20, borderLeft: '4px solid var(--primary)' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Bank Deposit Details</h4>
                        <p style={{ margin: '5px 0' }}><strong>Name:</strong> SENAKA K A S</p>
                        <p style={{ margin: '5px 0' }}><strong>Account No:</strong> 101020255990</p>
                        <p style={{ margin: '5px 0' }}><strong>Branch:</strong> HNB Pelmadulla branch</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Amount Paid (Rs.)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Payment Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Bank Reference / Receipt No</label>
                            <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Slip Image</label>
                            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required style={{ width: '100%' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? 'Uploading...' : 'Submit Payment Slip'}
                        </button>
                    </form>
                </div>

                {/* History Table */}
                <div style={{ flex: '2 1 500px', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Payment History</h3>
                    {loading ? <p>Loading history...</p> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Date</th>
                                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Amount</th>
                                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Reference</th>
                                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Status</th>
                                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{new Date(item.paymentDate).toLocaleDateString()}</td>
                                            <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Rs. {item.amount}</td>
                                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{item.referenceNumber}</td>
                                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: 12, 
                                                    fontSize: 12, 
                                                    fontWeight: 'bold',
                                                    backgroundColor: item.status === 'Approved' ? '#e8f5e9' : (item.status === 'Rejected' ? '#ffebee' : '#fff3e0'),
                                                    color: item.status === 'Approved' ? '#2e7d32' : (item.status === 'Rejected' ? '#c62828' : '#e65100')
                                                }}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: 10, borderBottom: '1px solid #eee', fontSize: 13 }}>{item.adminNotes || '-'}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#888' }}>No payment slips uploaded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionBilling;
