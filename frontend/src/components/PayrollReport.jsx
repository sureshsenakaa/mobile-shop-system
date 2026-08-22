import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

const PayrollReport = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/payroll/commissions?month=${month}&year=${year}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayroll(data);
            }
        } catch (err) {
            console.error('Failed to fetch payroll', err);
        }
        setLoading(false);
    };

    const handlePay = async (user) => {
        const amount = user.totalCommission;
        if (amount <= 0) return;
        
        if (!window.confirm(`Are you sure you want to pay Rs. ${amount.toFixed(2)} to ${user.username}? This will deduct cash from today's cash register.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/payroll/pay`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.userId,
                    username: user.username,
                    month: parseInt(month),
                    year: parseInt(year),
                    amount: amount
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert('✅ Salary paid successfully!');
                fetchPayroll(); // Refresh the data to show it's paid
            } else {
                alert(`❌ Error: ${data.error || 'Failed to pay salary'}`);
            }
        } catch (err) {
            console.error(err);
            alert('❌ Failed to process payment.');
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [month, year]);

    return (
        <div className="card">
            <h2 style={{ color: '#2e7d32', marginBottom: 20 }}>💸 Staff Payroll & Commissions</h2>
            
            <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Month</label>
                    <input type="number" min="1" max="12" value={month} onChange={e => setMonth(e.target.value)} className="input" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Year</label>
                    <input type="number" min="2020" max="2100" value={year} onChange={e => setYear(e.target.value)} className="input" />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={fetchPayroll} className="btn btn-primary">Refresh</button>
                </div>
            </div>

            {loading ? <p>Loading payroll data...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Staff Member</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Role</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Basic Salary</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Sales Comm.</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Repair Comm.</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd' }}>Total Earnings</th>
                                <th style={{ padding: 12, borderBottom: '2px solid #ddd', textAlign: 'center' }}>Status / Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payroll.map(user => (
                                <tr key={user.userId}>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 12, fontSize: 11 }}>{user.role}</span>
                                    </td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>Rs. {Number(user.basicSalary || 0).toFixed(2)}</td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>Rs. {Number(user.totalSalesCommission).toFixed(2)}</td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>Rs. {Number(user.totalRepairCommission).toFixed(2)}</td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#2e7d32' }}>Rs. {Number(user.totalCommission).toFixed(2)}</td>
                                    <td style={{ padding: 12, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                        {user.isPaid ? (
                                            <span style={{ 
                                                background: '#dcfce7', color: '#166534', padding: '4px 10px', 
                                                borderRadius: 12, fontSize: 12, fontWeight: 'bold' 
                                            }}>
                                                ✅ Paid (Rs. {Number(user.paidAmount).toFixed(2)})
                                            </span>
                                        ) : user.totalCommission > 0 ? (
                                            <button 
                                                onClick={() => handlePay(user)} 
                                                className="btn btn-sm btn-outline"
                                                style={{ borderColor: '#0ea5e9', color: '#0ea5e9', padding: '4px 10px' }}
                                            >
                                                💸 Pay Salary
                                            </button>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payroll.length === 0 && <tr><td colSpan="7" style={{ padding: 20, textAlign: 'center', color: '#888' }}>No data for selected month.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PayrollReport;
