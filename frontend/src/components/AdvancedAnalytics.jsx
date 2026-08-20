import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

const AdvancedAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Default to 'This Month'
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
    const [dateRangeMode, setDateRangeMode] = useState('month'); // 'month', 'last_month', 'all_time', 'custom'

    const loadData = async (start, end) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (start) queryParams.append('startDate', start);
            if (end) queryParams.append('endDate', end);
            
            const res = await fetch(`${API_BASE_URL}/analytics/dashboard?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setData(await res.json());
        } catch (err) {}
        setLoading(false);
    };

    useEffect(() => {
        loadData(startDate, endDate);
    }, [startDate, endDate]);

    const setPresetRange = (preset) => {
        setDateRangeMode(preset);
        const today = new Date();
        if (preset === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else if (preset === 'last_month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        } else if (preset === 'all_time') {
            setStartDate('');
            setEndDate('');
        }
    };

    if (loading) return <div className="card">Loading Analytics...</div>;
    if (!data) return <div className="card">Failed to load analytics.</div>;

    const { profitLoss, bestSellers, techPerformance } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <h2 style={{ color: '#333', margin: 0 }}>📈 Advanced Analytics</h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
                        <button className={`btn btn-sm ${dateRangeMode === 'month' ? '' : 'btn-ghost'}`} onClick={() => setPresetRange('month')}>This Month</button>
                        <button className={`btn btn-sm ${dateRangeMode === 'last_month' ? '' : 'btn-ghost'}`} onClick={() => setPresetRange('last_month')}>Last Month</button>
                        <button className={`btn btn-sm ${dateRangeMode === 'all_time' ? '' : 'btn-ghost'}`} onClick={() => setPresetRange('all_time')}>All Time</button>
                        <button className={`btn btn-sm ${dateRangeMode === 'custom' ? '' : 'btn-ghost'}`} onClick={() => setDateRangeMode('custom')}>Custom</button>
                    </div>
                    {dateRangeMode === 'custom' && (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }} />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }} />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="card" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <h3 style={{ marginTop: 0 }}>Profit & Loss (P&L)</h3>
                
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                    <div style={{ flex: 1, minWidth: 200, padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #1976d2' }}>
                        <div style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>REVENUE</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1976d2' }}>Rs. {((profitLoss?.totalSales || 0) + (profitLoss?.totalRepairs || 0)).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                            Sales: Rs. {profitLoss?.totalSales?.toFixed(2)} <br/>
                            Repairs: Rs. {profitLoss?.totalRepairs?.toFixed(2)}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #ed6c02' }}>
                        <div style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>COSTS (COGS)</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ed6c02' }}>Rs. {((profitLoss?.totalCogs || 0) + (profitLoss?.totalRepairPartsCost || 0)).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                            Products Cost: Rs. {profitLoss?.totalCogs?.toFixed(2)} <br/>
                            Repair Parts: Rs. {profitLoss?.totalRepairPartsCost?.toFixed(2)}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #d32f2f' }}>
                        <div style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>OPERATING EXPENSES</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d32f2f' }}>Rs. {profitLoss?.totalExpenses?.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                            Bills, Salaries, Maintenance, etc.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, padding: 15, background: '#fff', borderRadius: 8, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: 12, color: '#666' }}>Gross Profit (Revenue - Costs)</div>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>Rs. {profitLoss?.grossProfit?.toFixed(2)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, padding: 15, background: '#fff', borderRadius: 8, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: 12, color: '#666' }}>Net Profit (Gross Profit - Expenses)</div>
                        <div style={{ fontSize: 28, fontWeight: 'bold', color: profitLoss?.netProfit >= 0 ? '#2e7d32' : '#d32f2f' }}>Rs. {profitLoss?.netProfit?.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: 1, minWidth: 300 }}>
                    <h3 style={{ marginTop: 0 }}>🏆 Best Sellers</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {(!bestSellers || bestSellers.length === 0) ? (
                            <li style={{ padding: 20, textAlign: 'center', color: '#888' }}>No sales data available.</li>
                        ) : bestSellers.map((item, idx) => (
                            <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.productName}</span>
                                <strong style={{ color: '#1976d2' }}>{item.totalQuantity} sold</strong>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card" style={{ flex: 1, minWidth: 300 }}>
                    <h3 style={{ marginTop: 0 }}>👨‍🔧 Technician Performance</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {(!techPerformance || techPerformance.length === 0) ? (
                            <li style={{ padding: 20, textAlign: 'center', color: '#888' }}>No repair data available for this period.</li>
                        ) : techPerformance.map((tech, idx) => (
                            <li key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{tech.assignedTechnician}</span>
                                <span>
                                    <strong>{tech.jobsCompleted}</strong> jobs | 
                                    <strong style={{ color: '#2e7d32', marginLeft: 5 }}>Rs. {tech.revenueGenerated}</strong>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
export default AdvancedAnalytics;
