import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../api/supplierApi';
import { getProducts } from '../api/productApi';
import { API_BASE_URL } from '../api/config';
import { getAuthHeader } from '../api/authApi';

const AddPurchaseOrder = ({ onCancel, onSaved }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [items, setItems] = useState([]); // { productId, productName, quantity, cost, subtotal }
    
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);
    const [cost, setCost] = useState(0);

    useEffect(() => {
        const fetchAll = async () => {
            const sups = await getSuppliers();
            const prods = await getProducts();
            setSuppliers(sups || []);
            setProducts(prods || []);
        };
        fetchAll();
    }, []);

    const handleAddItem = () => {
        if (!selectedProduct) return alert('Select a product');
        if (qty <= 0) return alert('Quantity must be greater than 0');
        if (cost < 0) return alert('Cost cannot be negative');

        const prod = products.find(p => String(p._id || p.id) === String(selectedProduct));
        if (!prod) return alert('Invalid product');

        const subtotal = qty * cost;

        const existing = items.findIndex(i => String(i.productId) === String(prod._id || prod.id));
        if (existing >= 0) {
            const newItems = [...items];
            newItems[existing].quantity += parseInt(qty);
            newItems[existing].subtotal = newItems[existing].quantity * newItems[existing].cost;
            setItems(newItems);
        } else {
            setItems([...items, { 
                productId: prod._id || prod.id, 
                productName: `${prod.brand} ${prod.model}`, 
                quantity: parseInt(qty), 
                cost: parseFloat(cost), 
                subtotal,
                productType: prod.type || 'Phone',
                isPhone: (prod.type || 'Phone') === 'Phone'
            }]);
        }

        setSelectedProduct('');
        setQty(1);
        setCost(0);
    };

    const handleRemoveItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSupplier) return alert('Select a supplier');
        
        let currentItems = [...items];
        // If user filled in a product but forgot to click Add, auto-add it
        if (selectedProduct) {
            const prod = products.find(p => String(p._id || p.id) === String(selectedProduct));
            if (prod && qty > 0 && cost >= 0) {
                const subtotal = qty * cost;
                currentItems.push({
                    productId: prod._id || prod.id, 
                    productName: `${prod.brand} ${prod.model}`, 
                    quantity: parseInt(qty), 
                    cost: parseFloat(cost), 
                    subtotal,
                    productType: prod.type || 'Phone',
                    isPhone: (prod.type || 'Phone') === 'Phone'
                });
            }
        }

        if (currentItems.length === 0) return alert('Add at least one item');

        const totalAmount = currentItems.reduce((sum, item) => sum + item.subtotal, 0);

        const payload = {
            supplierId: selectedSupplier,
            status: 'Draft',
            items: currentItems,
            totalAmount: totalAmount
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('Purchase Order Created Successfully!');
                onSaved();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create PO');
            }
        } catch (err) {
            alert('Failed to create PO');
        }
    };

    const handleProductSelect = (e) => {
        const pId = e.target.value;
        setSelectedProduct(pId);
        const prod = products.find(p => String(p._id || p.id) === String(pId));
        if (prod) {
            setCost(prod.cost || 0);
        }
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="card form-card">
            <h2>📝 Create Purchase Order</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                    <label className="form-label">Supplier</label>
                    <select className="input" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required>
                        <option value="">-- Select Supplier --</option>
                        {suppliers.map(s => (
                            <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.phone})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20 }}>
                    <div style={{ flex: 2 }}>
                        <label className="form-label">Product</label>
                        <select className="input" value={selectedProduct} onChange={handleProductSelect}>
                            <option value="">-- Choose Product --</option>
                            {products.map(p => (
                                <option key={p._id || p.id} value={p._id || p.id}>{p.brand} {p.model} - Current Stock: {p.stock}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Order Qty</label>
                        <input type="number" min="1" className="input" value={qty} onChange={e => setQty(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Unit Cost (Rs.)</label>
                        <input type="number" min="0" step="0.01" className="input" value={cost} onChange={e => setCost(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <button type="button" onClick={handleAddItem} className="btn btn-primary" style={{ width: '100%' }}>Add</button>
                    </div>
                </div>

                {items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: 10 }}>Product</th>
                                <th style={{ padding: 10, textAlign: 'right' }}>Qty</th>
                                <th style={{ padding: 10, textAlign: 'right' }}>Cost</th>
                                <th style={{ padding: 10, textAlign: 'right' }}>Subtotal</th>
                                <th style={{ padding: 10, textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: 10 }}>{item.productName}</td>
                                    <td style={{ padding: 10, textAlign: 'right' }}>{item.quantity}</td>
                                    <td style={{ padding: 10, textAlign: 'right' }}>Rs. {item.cost.toFixed(2)}</td>
                                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold' }}>Rs. {item.subtotal.toFixed(2)}</td>
                                    <td style={{ padding: 10, textAlign: 'center' }}>
                                        <button type="button" onClick={() => handleRemoveItem(idx)} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }}>X</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" style={{ padding: 10, textAlign: 'right', fontWeight: 'bold' }}>Total Amount:</td>
                                <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: '#0284c7' }}>Rs. {total.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Save Purchase Order</button>
                </div>
            </form>
        </div>
    );
};

export default AddPurchaseOrder;
