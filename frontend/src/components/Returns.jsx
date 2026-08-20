import React, { useState, useEffect } from 'react';
import { getReturns, createReturn } from '../api/returnApi';
import { getSales } from '../api/saleApi';

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [sales, setSales] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [searchSaleId, setSearchSaleId] = useState('');
    const [foundSale, setFoundSale] = useState(null);
    const [selectedItems, setSelectedItems] = useState({}); // { index: { quantity, returnToStock, reason, refund } }
    const [globalRefund, setGlobalRefund] = useState(0);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rets, sls] = await Promise.all([getReturns(), getSales()]);
            setReturns(rets || []);
            setSales(sls || []);
        } catch (err) {
            console.error('Failed to load data', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearchSale = () => {
        if (!searchSaleId) return alert('Enter a Search Term');
        const term = searchSaleId.toLowerCase();
        
        const sale = sales.find(s => 
            s.id.toString() === term || 
            `sale-${s.id}` === term || 
            (s.customerMobile && s.customerMobile.includes(term)) ||
            (s.customerName && s.customerName.toLowerCase().includes(term)) ||
            (s.items && s.items.some(i => i.imei && i.imei.toLowerCase() === term))
        );

        if (!sale) return alert('Sale not found. Try searching by Sale ID, Customer Name, Mobile, or IMEI.');
        if (sale.returned) return alert('This sale has already been marked as fully returned.');
        
        setFoundSale(sale);
        setSelectedItems({});
        setGlobalRefund(0);
    };

    const handleToggleItem = (idx, item) => {
        let newSelected = { ...selectedItems };
        if (newSelected[idx]) {
            delete newSelected[idx];
        } else {
            newSelected[idx] = {
                productId: item.productId,
                productName: item.productName,
                quantity: 1,
                imei: item.imei,
                returnToStock: true,
                reason: 'Defective',
                refund: item.price
            };
        }
        setSelectedItems(newSelected);
        
        // Auto-calculate refund
        const total = Object.values(newSelected).reduce((sum, sel) => sum + (sel.quantity * sel.refund), 0);
        setGlobalRefund(total);
    };

    const handleItemChange = (idx, field, value) => {
        let newSelected = {
            ...selectedItems,
            [idx]: {
                ...selectedItems[idx],
                [field]: value
            }
        };
        setSelectedItems(newSelected);
        
        if (field === 'quantity') {
            const total = Object.values(newSelected).reduce((sum, sel) => sum + (sel.quantity * sel.refund), 0);
            setGlobalRefund(total);
        }
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        const itemsToReturn = Object.values(selectedItems);
        if (itemsToReturn.length === 0) return alert('Select at least one item to return');
        
        const payload = {
            saleId: foundSale.id,
            customerId: null, // Depending on if your sale stores customerId
            itemsReturned: itemsToReturn,
            totalRefund: globalRefund
        };

        try {
            await createReturn(payload);
            alert('Return processed successfully!');
            setShowCreate(false);
            setFoundSale(null);
            setSearchSaleId('');
            loadData();
        } catch (err) {
            alert('Failed to process return');
        }
    };

    if (showCreate) {
        return (
            <div className="card form-card" style={{ maxWidth: 800 }}>
                <h2>🔄 Process New Return (RMA)</h2>
                
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input 
                        type="text" 
                        placeholder="Enter Sale ID, Customer Mobile, Name, or IMEI..." 
                        className="input" 
                        value={searchSaleId} 
                        onChange={e => setSearchSaleId(e.target.value)} 
                        style={{ flex: 1 }}
                    />
                    <button onClick={handleSearchSale} className="btn btn-primary">Search Sale</button>
                    <button onClick={() => { setShowCreate(false); setFoundSale(null); setSearchSaleId(''); }} className="btn btn-ghost">Cancel</button>
                </div>

                {!foundSale && (
                    <div style={{ marginTop: 20 }}>
                        <h4 style={{ marginBottom: 15, color: '#475569' }}>Recent Sales</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: 12 }}>Sale ID</th>
                                        <th style={{ padding: 12 }}>Date</th>
                                        <th style={{ padding: 12 }}>Customer</th>
                                        <th style={{ padding: 12 }}>Items Sold</th>
                                        <th style={{ padding: 12, textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.filter(s => !s.returned).slice(0, 10).map(sale => (
                                        <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 12, fontWeight: 'bold' }}>SALE-{sale.id}</td>
                                            <td style={{ padding: 12, color: '#64748b' }}>{new Date(sale.date).toLocaleDateString()}</td>
                                            <td style={{ padding: 12 }}>
                                                {sale.customerName || 'Walk-in'}
                                                {sale.customerMobile && <div style={{ fontSize: 12, color: '#94a3b8' }}>{sale.customerMobile}</div>}
                                            </td>
                                            <td style={{ padding: 12 }}>
                                                {(sale.items || []).map((it, i) => (
                                                    <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {it.quantity}x {it.productName}</div>
                                                ))}
                                            </td>
                                            <td style={{ padding: 12, textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => {
                                                        setFoundSale(sale);
                                                        setSelectedItems({});
                                                        setGlobalRefund(0);
                                                    }}
                                                    className="btn btn-sm btn-outline" 
                                                    style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '6px 12px' }}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {sales.filter(s => !s.returned).length === 0 && (
                                        <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No recent sales found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {foundSale && (
                    <form onSubmit={handleSubmitReturn}>
                        <div style={{ background: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Sale Details</h4>
                            <p style={{ margin: 0, fontSize: 13 }}><strong>Customer:</strong> {foundSale.customerName || 'Walk-in'} ({foundSale.customerMobile || 'N/A'})</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: 13 }}><strong>Date:</strong> {new Date(foundSale.date).toLocaleString()}</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: 13 }}><strong>Total Bill:</strong> Rs. {foundSale.total}</p>
                        </div>

                        <h4>Select Items to Return</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                    <th style={{ padding: 10 }}>Select</th>
                                    <th style={{ padding: 10 }}>Product</th>
                                    <th style={{ padding: 10 }}>Max Qty</th>
                                    <th style={{ padding: 10 }}>Return Settings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(foundSale.items || []).map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: 10, textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={!!selectedItems[idx]} 
                                                onChange={() => handleToggleItem(idx, item)} 
                                                style={{ width: 20, height: 20 }}
                                            />
                                        </td>
                                        <td style={{ padding: 10 }}>
                                            {item.productName}
                                            {item.imei && <div style={{ fontSize: 11, color: '#64748b' }}>IMEI: {item.imei}</div>}
                                            <div style={{ fontSize: 11, color: '#0ea5e9' }}>Sold for: Rs. {item.price}</div>
                                        </td>
                                        <td style={{ padding: 10, fontWeight: 'bold' }}>{item.quantity}</td>
                                        <td style={{ padding: 10 }}>
                                            {selectedItems[idx] && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {!item.imei && (
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            max={item.quantity} 
                                                            className="input" 
                                                            value={selectedItems[idx].quantity} 
                                                            onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value))} 
                                                            placeholder="Qty to return" 
                                                        />
                                                    )}
                                                    <select 
                                                        className="input" 
                                                        value={selectedItems[idx].reason} 
                                                        onChange={e => handleItemChange(idx, 'reason', e.target.value)}
                                                    >
                                                        <option value="Defective">Defective / Faulty</option>
                                                        <option value="Customer Changed Mind">Customer Changed Mind</option>
                                                        <option value="Wrong Item">Wrong Item Sold</option>
                                                    </select>
                                                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedItems[idx].returnToStock} 
                                                            onChange={e => handleItemChange(idx, 'returnToStock', e.target.checked)} 
                                                        />
                                                        Return to active stock? (Uncheck if sending to supplier)
                                                    </label>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginBottom: 20 }}>
                            <label className="form-label" style={{ color: '#b91c1c' }}>Total Cash Refund to Customer (Rs.)</label>
                            <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="input" 
                                value={globalRefund} 
                                onChange={e => setGlobalRefund(e.target.value)} 
                                style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
                            />
                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>This will be logged as an expense in P&L.</p>
                        </div>

                        <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>Complete Return</button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>🔙 Returns & RMA Management</h2>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Process New Return</button>
            </div>
            
            {loading ? <p>Loading returns...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                            <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Return ID</th>
                            <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Sale ID</th>
                            <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Items Returned</th>
                            <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Refund Given</th>
                            <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.map(ret => (
                            <tr key={ret.id}>
                                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>RMA-{ret.id}</td>
                                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>SALE-{ret.saleId}</td>
                                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                    {(ret.itemsReturned || []).map((it, i) => (
                                        <div key={i} style={{ fontSize: 12, marginBottom: 4, background: '#f8fafc', padding: '2px 4px', borderRadius: 4 }}>
                                            {it.quantity}x <strong>{it.productName || `Product ID: ${it.productId}`}</strong> - {it.reason}
                                            {it.returnToStock ? <span style={{ color: '#16a34a', marginLeft: 4 }}>[Stocked]</span> : <span style={{ color: '#dc2626', marginLeft: 4 }}>[Supplier RMA]</span>}
                                        </div>
                                    ))}
                                </td>
                                <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#b91c1c' }}>Rs. {(ret.totalRefund || 0).toFixed(2)}</td>
                                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{new Date(ret.dateCreated).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {returns.length === 0 && <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No returns processed yet.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
    );
};
export default Returns;
