import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer } from '../api/customerApi';
import { getProducts } from '../api/productApi';
import { addSale } from '../api/saleApi';
import { API_BASE_URL } from '../api/config';

const AddSaleDesktop = ({ onSaleAdded, onCancel, authUser }) => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerMobile, setNewCustomerMobile] = useState('');
    const [customerCreateError, setCustomerCreateError] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');

    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedImei, setSelectedImei] = useState('');
    const [selectedQty, setSelectedQty] = useState(1);

    const [items, setItems] = useState([]); // { productId, productName, price, quantity, subtotal }
    const [discount, setDiscount] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);

    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [splitPayments, setSplitPayments] = useState({ cash: 0, card: 0, bank: 0, credit: 0 });

    useEffect(() => {
        const fetch = async () => {
            const prods = await getProducts();
            setProducts(prods || []);
            const custs = await getCustomers();
            setCustomers(custs || []);
        };
        fetch();
    }, []);

    // Recalculate totals when items or discount change
    useEffect(() => {
        const s = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
        setSubtotal(s);
        const d = parseFloat(discount) || 0;
        setTotal(Math.max(0, s - d));
    }, [items, discount]);

    const addItem = (productId, qty, imei) => {
        const product = products.find(p => String(p.id || p._id) === String(productId));
        if (!product) return alert('Please select a valid product');

        if (product.imeiList && product.imeiList.length > 0 && !imei) {
            return alert('Please select an IMEI for this product');
        }

        const q = parseInt(qty) || 1;
        if (q <= 0) return alert('Quantity must be at least 1');

        if (imei && q > 1) {
            return alert('Quantity must be 1 when selecting a specific IMEI.');
        }

        if (imei) {
            const existingImei = items.find(i => i.productId === productId && i.imei === imei);
            if (existingImei) return alert('This specific IMEI is already in the cart.');
        }

        const existingQty = items.filter(i => i.productId === productId).reduce((s, it) => s + it.quantity, 0);
        if (product.stock < existingQty + q) return alert(`Not enough stock for ${product.brand} ${product.model}. Only ${product.stock - existingQty} left.`);

        const name = imei ? `${product.brand} ${product.model} (IMEI: ${imei})` : `${product.brand} ${product.model}`;
        const price = Number(product.price) || 0;
        const itemSubtotal = price * q;

        if (!imei) {
            const idx = items.findIndex(i => i.productId === productId && !i.imei);
            if (idx > -1) {
                const copy = [...items];
                copy[idx].quantity += q;
                copy[idx].subtotal = copy[idx].price * copy[idx].quantity;
                setItems(copy);
            } else {
                setItems(prev => [...prev, { productId, productName: name, price, quantity: q, subtotal: itemSubtotal }]);
            }
        } else {
            setItems(prev => [...prev, { productId, productName: name, price, quantity: q, subtotal: itemSubtotal, imei }]);
        }

        setSelectedProductId('');
        setSelectedImei('');
        setSelectedQty(1);
    };

    const removeItem = (productId) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    // Barcode handling: add product with qty 1 on Enter
    const handleBarcodeKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = barcodeInput.trim();
            if (!barcode) return;

            let product = products.find(p => p.barcode === barcode);
            let foundImei = null;

            if (!product) {
                // Check if barcode matches any IMEI
                for (const p of products) {
                    if (p.imeiList && p.imeiList.includes(barcode)) {
                        product = p;
                        foundImei = barcode;
                        break;
                    }
                }
            }

            if (!product) return alert(`Product or IMEI ${barcode} not found`);

            if (product.imeiList && product.imeiList.length > 0 && !foundImei) {
                if (product.imeiList.length === 1) {
                    foundImei = product.imeiList[0];
                } else {
                    setSelectedProductId(product.id || product._id);
                    alert('Product selected. Please choose or scan the specific IMEI.');
                    setBarcodeInput('');
                    return;
                }
            }

            addItem(product.id || product._id, 1, foundImei);
            setBarcodeInput('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return alert('Please add at least one product to the sale');

        if (paymentMethod === 'Split') {
            const splitTotal = Number(splitPayments.cash) + Number(splitPayments.card) + Number(splitPayments.bank) + Number(splitPayments.credit);
            if (splitTotal !== total) return alert('Split payments must equal the total bill.');
            if (splitPayments.credit > 0 && !customerName) return alert('Customer name is required for credit sales.');
        } else if (paymentMethod === 'Credit' && !customerName) {
            return alert('Customer name is required for credit sales.');
        }

        const saleData = {
            items: items.map(it => ({ productId: it.productId, productName: it.productName, price: it.price, quantity: it.quantity, subtotal: it.subtotal, imei: it.imei })),
            customerName: customerName,
            customerMobile: customerMobile,
            subtotal: subtotal,
            discount: parseFloat(discount) || 0,
            total: total,
            paymentMethod,
            paymentDetails: paymentMethod === 'Split' ? splitPayments : {},
            // send a full ISO timestamp so server and UI have precise datetime
            date: new Date().toISOString()
        };

        try {
            const saved = await addSale(saleData);
            alert('Sale completed!');
            onSaleAdded(saved && saved._id ? saved._id : null);

            if (window.confirm('Print receipt now?')) {
                const sale = { ...saleData, ...saved };
                const rows = (sale.items || []).map(it => `<tr><td>${it.productName}</td><td style="text-align:right;">${it.quantity}</td><td style="text-align:right;">Rs. ${Number(it.price).toFixed(2)}</td><td style="text-align:right;">Rs. ${Number(it.subtotal).toFixed(2)}</td></tr>`).join('');
                
                const logoHtml = authUser && authUser.printLogo && authUser.logoUrl 
                    ? `<div style="text-align:center; margin-bottom: 10px;"><img src="${API_BASE_URL.replace('/api', '')}${authUser.logoUrl}" style="max-width: 200px;" /></div>` 
                    : '';

                const receiptHtml = `
                    <html>
                    <head>
                        <title>Sale Receipt</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .items { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            .items th, .items td { border: 1px solid #000; padding: 8px; }
                            .total { font-weight: bold; }
                            @media print { body { padding: 0; margin: 0; width: 100%; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            ${logoHtml}
                            <h2>${authUser ? authUser.shopName : 'INVOICE'}</h2>
                            <div>${sale.date || ''}</div>
                        </div>
                        <div>
                            <div><strong>Customer:</strong> ${sale.customerName || 'Walk-in'}</div>
                            <div><strong>Mobile:</strong> ${sale.customerMobile || '-'}</div>
                        </div>
                        <table class="items">
                            <thead>
                                <tr><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Amount</th></tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                        <div style="margin-top:20px; text-align:right;">
                            <div>Subtotal: Rs. ${Number(sale.subtotal).toFixed(2)}</div>
                            <div>Discount: Rs. ${Number(sale.discount).toFixed(2)}</div>
                            <div class="total">Grand Total: Rs. ${Number(sale.total).toFixed(2)}</div>
                        </div>
                        <script>
                            window.onload = function() { window.print(); };
                        </script>
                    </body>
                    </html>
                `;

                const newWindow = window.open('', '_blank', 'width=600,height=800');
                if (newWindow) {
                    newWindow.document.open();
                    newWindow.document.write(receiptHtml);
                    newWindow.document.close();
                } else {
                    alert('Popup blocked. Please allow popups for this site to print receipts.');
                }
            }

            // reset form
            setItems([]);
            setCustomerName('');
            setCustomerMobile('');
            setDiscount(0);
            setSubtotal(0);
            setTotal(0);
        } catch (err) {
            console.error(err);
            // Show backend error message when available (e.g., unauthorized)
            alert(err && err.message ? `Failed to complete sale: ${err.message}` : 'Failed to complete sale');
        }
    };

    return (
        <div className="card form-card">
            <h2 style={{ textAlign: 'center', color: '#333' }}>New Sale (POS)</h2>
            <form onSubmit={handleSubmit}>

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

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Select Product</label>
                        <select className="input" value={selectedProductId} onChange={e => {
                            const pid = e.target.value;
                            setSelectedProductId(pid);
                            
                            const selectedProd = products.find(p => String(p.id || p._id) === String(pid));
                            if (selectedProd && selectedProd.imeiList && selectedProd.imeiList.length === 1) {
                                setSelectedImei(selectedProd.imeiList[0]);
                            } else {
                                setSelectedImei('');
                            }
                        }}>
                            <option value="">-- Choose a Product --</option>
                            {products.map(p => (
                                <option key={(p.id || p._id)} value={(p.id || p._id)} disabled={p.stock === 0}>{p.brand} {p.model} (Rs. {p.price}) - {p.stock} left</option>
                            ))}
                        </select>
                    </div>

                    {selectedProductId && products.find(p => String(p.id || p._id) === String(selectedProductId))?.imeiList?.length > 0 && (
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Select IMEI</label>
                            <select className="input" value={selectedImei} onChange={e => setSelectedImei(e.target.value)}>
                                <option value="">-- Choose IMEI --</option>
                                {products.find(p => String(p.id || p._id) === String(selectedProductId)).imeiList.map(imei => {
                                    const isAdded = items.find(i => i.productId === selectedProductId && i.imei === imei);
                                    return <option key={imei} value={imei} disabled={isAdded}>{imei} {isAdded ? '(Added)' : ''}</option>;
                                })}
                            </select>
                        </div>
                    )}

                    {!products.find(p => String(p.id || p._id) === String(selectedProductId))?.imeiList?.length && (
                        <div style={{ width: 120 }}>
                            <label className="form-label">Quantity</label>
                            <input type="number" min="1" className="input" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} />
                        </div>
                    )}
                    <div style={{ width: 140 }}>
                        <button type="button" onClick={() => addItem(selectedProductId, products.find(p => String(p.id || p._id) === String(selectedProductId))?.imeiList?.length > 0 ? 1 : selectedQty, selectedImei)} className="btn btn-primary" style={{ width: '100%' }}>Add Item</button>
                    </div>
                </div>

                <div style={{ marginTop: 18 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style={{ textAlign: 'right' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(it => (
                                <tr key={it.productId}>
                                    <td>{it.productName}</td>
                                    <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>Rs. {Number(it.price).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '700' }}>Rs. {Number(it.subtotal).toFixed(2)}</td>
                                    <td><button type="button" onClick={() => removeItem(it.productId)} className="btn btn-danger btn-sm">Remove</button></td>
                                </tr>
                            ))}
                            {items.length === 0 && <tr><td colSpan={5} className="small-muted">No items added.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'flex-start' }}>
                    <div style={{ flex: '1 1 360px' }}>
                        <label className="form-label">Customer Mobile</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="input"
                                type="text"
                                list="customer-mobile-list"
                                placeholder="Type or select mobile number"
                                value={customerMobile}
                                onChange={(e) => {
                                    const mobile = e.target.value;
                                    const customer = customers.find(c => c.mobile === mobile);
                                    setCustomerMobile(mobile);
                                    setCustomerName(customer ? (customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()) : '');
                                }}
                                style={{ flex: 1 }}
                            />
                            <button type="button" onClick={() => {
                                setCustomerCreateError('');
                                setNewCustomerName('');
                                setNewCustomerMobile(customerMobile || '');
                                setCustomerModalOpen(true);
                            }} className="btn btn-outline" style={{ padding: '8px 10px' }}>+ Add</button>
                        </div>
                        <datalist id="customer-mobile-list">
                            {customers.map(c => (
                                <option key={c.id || c._id} value={c.mobile}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}</option>
                            ))}
                        </datalist>

                        <label className="form-label">Customer Name</label>
                        <input className="input" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>

                    {customerModalOpen && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                <h3 style={{ marginTop: 0 }}>Add Customer</h3>
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                                    <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} placeholder="Customer Name" />
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ display: 'block', marginBottom: 6 }}>Mobile</label>
                                    <input type="text" value={newCustomerMobile} onChange={(e) => setNewCustomerMobile(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} placeholder="Mobile Number" />
                                </div>
                                {customerCreateError && <div style={{ color: '#d32f2f', marginBottom: 10 }}>{customerCreateError}</div>}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button type="button" onClick={() => setCustomerModalOpen(false)} className="btn btn-ghost">Cancel</button>
                                    <button type="button" onClick={async () => {
                                        // basic validation
                                        if (!newCustomerName || !newCustomerMobile) {
                                            setCustomerCreateError('Name and mobile are required');
                                            return;
                                        }
                                        try {
                                            const payload = { name: newCustomerName, mobile: newCustomerMobile };
                                            const created = await addCustomer(payload);
                                            // refresh customers list
                                            const custs = await getCustomers();
                                            setCustomers(custs || []);
                                            // populate form with created customer
                                            setCustomerMobile(created.mobile || newCustomerMobile);
                                            setCustomerName(created.name || newCustomerName);
                                            setCustomerModalOpen(false);
                                        } catch (err) {
                                            console.error(err);
                                            setCustomerCreateError(err && err.message ? err.message : 'Failed to create customer');
                                        }
                                    }} className="btn btn-primary">Create</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ width: 260 }}>
                        <label className="form-label">Discount (Rs.)</label>
                        <input type="number" min="0" step="0.01" className="input" value={discount} onChange={e => setDiscount(e.target.value)} />

                        <label className="form-label">Subtotal (Rs.)</label>
                        <div className="input" style={{ backgroundColor: '#f5f5f5' }}>{`Rs. ${subtotal.toFixed(2)}`}</div>

                        <label className="form-label">Total Bill (Rs.)</label>
                        <div className="input" style={{ backgroundColor: '#f5f5f5', fontWeight: '700', color: '#2e7d32', marginBottom: 15 }}>
                            Rs. {total.toFixed(2)}
                        </div>
                        
                        <label className="form-label">Payment Method</label>
                        <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ marginBottom: 10 }}>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit">Credit</option>
                            <option value="Split">Split Payment</option>
                        </select>
                        
                        {paymentMethod === 'Split' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 10, background: '#f5f7fa', borderRadius: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Cash:</span>
                                    <input type="number" min="0" value={splitPayments.cash} onChange={e => setSplitPayments({...splitPayments, cash: Number(e.target.value)})} style={{ width: 100, padding: 4 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Card:</span>
                                    <input type="number" min="0" value={splitPayments.card} onChange={e => setSplitPayments({...splitPayments, card: Number(e.target.value)})} style={{ width: 100, padding: 4 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Bank:</span>
                                    <input type="number" min="0" value={splitPayments.bank} onChange={e => setSplitPayments({...splitPayments, bank: Number(e.target.value)})} style={{ width: 100, padding: 4 }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13 }}>Credit:</span>
                                    <input type="number" min="0" value={splitPayments.credit} onChange={e => setSplitPayments({...splitPayments, credit: Number(e.target.value)})} style={{ width: 100, padding: 4 }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Complete Sale</button>
                </div>
            </form>
        </div>
    );
};

export default AddSaleDesktop;
