import React, { useState, useEffect } from 'react';
import { getProducts } from '../api/productApi';
import { createQuotation } from '../api/quotationApi';

const fmt = (x) => `Rs. ${Number(x || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AddQuotation = ({ onQuotationAdded, onCancel }) => {
    const [products, setProducts] = useState([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');

    const [items, setItems] = useState([]); // { productId, productName, price, quantity, subtotal }
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [discount, setDiscount] = useState(0);
    const [validUntil, setValidUntil] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');

    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const prods = await getProducts();
                setProducts(prods || []);
            } catch (err) {
                console.error(err);
                setProducts([]);
            }
        };
        loadProducts();
    }, []);

    // Recalculate totals
    useEffect(() => {
        const s = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
        setSubtotal(s);
        const d = parseFloat(discount) || 0;
        setTotal(Math.max(0, s - d));
    }, [items, discount]);

    const addItem = (productId) => {
        const product = products.find(p => String(p.id || p._id) === String(productId));
        if (!product) return alert('Please select a valid product');

        const name = `${product.brand} ${product.model}`;
        const price = Number(product.price) || 0;

        // If item already in list, increment quantity
        const idx = items.findIndex(i => i.productId === productId);
        if (idx > -1) {
            const copy = [...items];
            copy[idx].quantity += 1;
            copy[idx].subtotal = copy[idx].price * copy[idx].quantity;
            setItems(copy);
        } else {
            setItems(prev => [...prev, { productId, productName: name, price, quantity: 1, subtotal: price }]);
        }

        setSelectedProductId('');
    };

    const updateItemQty = (index, qty) => {
        const q = parseInt(qty) || 0;
        if (q <= 0) return;
        const copy = [...items];
        copy[index].quantity = q;
        copy[index].subtotal = copy[index].price * q;
        setItems(copy);
    };

    const removeItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Barcode handling
    const handleBarcodeKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = barcodeInput.trim();
            if (!barcode) return;

            let product = products.find(p => p.barcode === barcode);

            if (!product) {
                // Check if barcode matches any IMEI
                for (const p of products) {
                    if (p.imeiList && p.imeiList.includes(barcode)) {
                        product = p;
                        break;
                    }
                }
            }

            if (!product) return alert(`Product or IMEI "${barcode}" not found`);

            addItem(product.id || product._id);
            setBarcodeInput('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return alert('Please add at least one item to the quotation');

        setSaving(true);
        try {
            const data = {
                items: items.map(it => ({
                    productId: it.productId,
                    productName: it.productName,
                    price: it.price,
                    quantity: it.quantity,
                    subtotal: it.subtotal
                })),
                customerName: customerName || '',
                customerMobile: customerMobile || '',
                subtotal,
                discount: parseFloat(discount) || 0,
                total,
                validUntil,
                notes,
                date: new Date().toISOString()
            };

            const result = await createQuotation(data);
            alert('Quotation saved successfully!');
            onQuotationAdded(result.id || result._id);
        } catch (err) {
            console.error(err);
            alert(err && err.message ? `Failed to save quotation: ${err.message}` : 'Failed to save quotation');
        }
        setSaving(false);
    };

    return (
        <div className="card form-card">
            <h2 style={{ textAlign: 'center', color: '#333' }}>📝 New Quotation</h2>
            <form onSubmit={handleSubmit}>

                {/* Barcode Scanner */}
                <label className="form-label">📊 Scan Barcode</label>
                <input
                    className="input"
                    style={{ fontSize: '16px', fontWeight: '700', backgroundColor: '#fffbea' }}
                    type="text"
                    placeholder="Scan or type barcode and press Enter..."
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    autoFocus
                />

                {/* Product Select */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginTop: 12 }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Select Product</label>
                        <select className="input" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                            <option value="">-- Choose a Product --</option>
                            {products.map(p => (
                                <option key={p.id || p._id} value={p.id || p._id}>
                                    {p.brand} {p.model} (Rs. {p.price}) - {p.stock} left
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ width: 140 }}>
                        <button type="button" onClick={() => addItem(selectedProductId)} className="btn btn-primary" style={{ width: '100%' }}>Add Item</button>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginTop: 18 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style={{ textAlign: 'right', width: 80 }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price (Rs.)</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                                <th style={{ width: 60 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{it.productName}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            value={it.quantity}
                                            onChange={e => updateItemQty(idx, e.target.value)}
                                            style={{ width: 60, padding: '4px 6px', textAlign: 'right' }}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{fmt(it.price)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(it.subtotal)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button type="button" onClick={() => removeItem(idx)} className="btn btn-danger btn-sm" title="Remove">❌</button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && <tr><td colSpan={5} className="small-muted">No items added.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Customer & Details */}
                <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 320px' }}>
                        <label className="form-label">Customer Name</label>
                        <input className="input" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />

                        <label className="form-label">Customer Mobile</label>
                        <input className="input" type="text" placeholder="Mobile number" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} />

                        <label className="form-label">Valid Until</label>
                        <input className="input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />

                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="input"
                            rows={3}
                            placeholder="Any special notes..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ width: 260 }}>
                        <label className="form-label">Discount (Rs.)</label>
                        <input type="number" min="0" step="0.01" className="input" value={discount} onChange={e => setDiscount(e.target.value)} />

                        <label className="form-label">Subtotal (Rs.)</label>
                        <div className="input" style={{ backgroundColor: '#f5f5f5' }}>{fmt(subtotal)}</div>

                        <label className="form-label">Total (Rs.)</label>
                        <div className="input" style={{ backgroundColor: '#f5f5f5', fontWeight: '700', color: '#2e7d32', fontSize: 18 }}>
                            {fmt(total)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="form-actions" style={{ marginTop: 24 }}>
                    <button type="button" onClick={onCancel} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Quotation'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddQuotation;
