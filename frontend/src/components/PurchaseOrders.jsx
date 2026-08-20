import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import AddPurchaseOrder from './AddPurchaseOrder';
import ReceiveGoodsModal from './ReceiveGoodsModal';

const PurchaseOrders = () => {
    const [pos, setPos] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [receivingPo, setReceivingPo] = useState(null); // PO being received
    
    const load = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/purchase-orders`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setPos(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleReceiveSuccess = () => {
        setReceivingPo(null);
        alert('✅ Goods received! Stock and IMEI list updated.');
        load();
    };

    if (showAddForm) {
        return <AddPurchaseOrder onCancel={() => setShowAddForm(false)} onSaved={() => { setShowAddForm(false); load(); }} />;
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>🛒 Purchase Orders</h2>
                <button onClick={() => setShowAddForm(true)} className="btn btn-primary">+ Create PO</button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>ID</th>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Items</th>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Amount</th>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: 10, borderBottom: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pos.map(po => (
                        <tr key={po.id}>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 700 }}>PO-{po.id}</td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold',
                                    background: po.status === 'Received' ? '#dcfce7' : '#fef9c3',
                                    color: po.status === 'Received' ? '#166534' : '#854d0e'
                                }}>
                                    {po.status}
                                </span>
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', fontSize: 13, color: '#475569' }}>
                                {(po.items || []).map((item, i) => (
                                    <div key={i}>{item.productName} × {item.quantity}</div>
                                ))}
                            </td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Rs. {(po.totalAmount || 0).toFixed(2)}</td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{new Date(po.dateCreated).toLocaleString()}</td>
                            <td style={{ padding: 10, borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                {po.status === 'Draft' || po.status === 'Sent' ? (
                                    <button
                                        onClick={() => setReceivingPo(po)}
                                        className="btn btn-sm btn-outline"
                                        style={{ borderColor: '#22c55e', color: '#22c55e' }}
                                    >
                                        📦 Receive Goods
                                    </button>
                                ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>✅ Completed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {pos.length === 0 && <tr><td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No Purchase Orders found.</td></tr>}
                </tbody>
            </table>

            {receivingPo && (
                <ReceiveGoodsModal
                    po={receivingPo}
                    onClose={() => setReceivingPo(null)}
                    onSuccess={handleReceiveSuccess}
                />
            )}
        </div>
    );
};
export default PurchaseOrders;
