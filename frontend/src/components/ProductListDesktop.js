import React, { useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { getProducts, deleteProduct, restockProduct, updateProduct } from '../api/productApi';
import { getSuppliers, addSupplier } from '../api/supplierApi';

const ProductListDesktop = ({ onAddClick }) => {
    const BTN_BASE = { padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13 };
    const BTN_PRIMARY = { ...BTN_BASE, backgroundColor: '#1976d2', color: '#fff' };
    const BTN_ACCENT = { ...BTN_BASE, backgroundColor: '#ffb300', color: '#222' };
    const BTN_DANGER = { padding: '6px 8px', borderRadius: 6, border: '1px solid #ef9a9a', background: 'transparent', color: '#ef5350', cursor: 'pointer' };
    const [products, setProducts] = useState([]);
    const [newestIds, setNewestIds] = useState([]);
    const [restockModalOpen, setRestockModalOpen] = useState(false);
    const [restockTarget, setRestockTarget] = useState(null);
    const [restockQty, setRestockQty] = useState('1');
    const [restockError, setRestockError] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierPhone, setNewSupplierPhone] = useState('');
    const [newSupplierEmail, setNewSupplierEmail] = useState('');
    const [supplierCreateError, setSupplierCreateError] = useState('');
    const [restockedId, setRestockedId] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({ brand: '', model: '', price: '', cost: '', stock: '', accessoryType: '' });
    const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'phones' | 'accessories'
    const [accessoryFilter, setAccessoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadProducts = async () => {
        try {
            const products = await getProducts();
            setProducts(products);
            // compute newest 5 by ObjectId timestamp
            try {
                const extractTs = id => parseInt(String(id).substring(0,8), 16) * 1000;
                const sorted = [...products].sort((a,b) => extractTs(b._id) - extractTs(a._id));
                const topIds = sorted.slice(0,5).map(p => p._id);
                setNewestIds(topIds);
            } catch (e) {
                setNewestIds([]);
            }
        } catch (err) {
            setProducts([]);
            setNewestIds([]);
        }
    };

    useEffect(() => {
        loadProducts();
        // load suppliers for the restock modal
        const fetchSuppliers = async () => {
            try {
                const s = await getSuppliers();
                setSuppliers(s);
            } catch (err) {
                setSuppliers([]);
            }
        };
        fetchSuppliers();
    }, []);

    const isAccessory = (p) => {
        if (!p) return false;
        if (p.imei) return false;
        if (p.imei1 || p.imei2) return false;
        if (p.serialNumber) return false;
        // fallback: if type explicitly set to 'Accessories', treat as accessory
        if (p.type && String(p.type).toLowerCase() === 'accessories') return true;
        // if no IMEI-like fields, consider it accessory
        return !(p && (p.imei || p.imei1 || p.imei2 || p.serialNumber));
    };

    // filter products by viewFilter: phones have an `imei` field, accessories do not
    let filteredProducts = products.filter(p => {
        if (viewFilter === 'all') return true;
        if (viewFilter === 'phones') return !!(p && (p.imei || p.imei1 || p.imei2));
        if (viewFilter === 'accessories') return !(p && (p.imei || p.imei1 || p.imei2));
        return true;
    });

    const ACCESSORY_TYPES = ['tempered','backcover','charger','cable','earphone','speaker','powerbank','Others'];
    // apply accessory type filter when viewing accessories
    if (viewFilter === 'accessories' && accessoryFilter) {
        filteredProducts = filteredProducts.filter(p => isAccessory(p) && ((p.accessoryType || '').toLowerCase() === accessoryFilter.toLowerCase()));
    }

    // Apply search term (makes it easy to search by brand, model or accessory type)
    if (searchTerm && String(searchTerm).trim() !== '') {
        const q = String(searchTerm).trim().toLowerCase();
        filteredProducts = filteredProducts.filter(p => {
            const fields = [p.brand, p.model || p.name, p.accessoryType, p.type, p.investorName, p.barcode];
            return fields.some(f => (f || '').toString().toLowerCase().includes(q));
        });
    }

    const totalInventoryValue = filteredProducts.reduce((sum, p) => sum + (Number(p.cost || 0) * Number(p.stock || 0)), 0);
    const totalInventoryUnits = filteredProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const totalRetailValue = filteredProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);

    const formatItemDate = (p) => {
        // prefer explicit dateAdded, fallback to ObjectId timestamp
        if (p && p.dateAdded) {
            try { return new Date(p.dateAdded).toLocaleString(); } catch (e) { /* fallthrough */ }
        }
        try {
            const ts = parseInt(String(p._id).substring(0,8), 16) * 1000;
            return new Date(ts).toLocaleString();
        } catch (e) {
            return '';
        }
    };

    const renderImei = (p) => {
        if (!p) return '-';
        if (p.imei) return Array.isArray(p.imei) ? p.imei.join(', ') : String(p.imei);
        const parts = [];
        if (p.imei1) parts.push(String(p.imei1));
        if (p.imei2) parts.push(String(p.imei2));
        if (parts.length) return parts.join(', ');
        if (p.serialNumber) return String(p.serialNumber);
        return '-';
    };

    const renderAccessoryBadge = (type) => {
        const t = (type || '').toLowerCase();
        const colorMap = {
            tempered: { bg: '#e3f2fd', color: '#0d47a1' },
            backcover: { bg: '#f1f8e9', color: '#2e7d32' },
            charger: { bg: '#fff3e0', color: '#ef6c00' },
            cable: { bg: '#f3e5f5', color: '#6a1b9a' },
            earphone: { bg: '#e8f5e9', color: '#2e7d32' },
            speaker: { bg: '#fff8e1', color: '#f57f17' },
            powerbank: { bg: '#e0f2f1', color: '#00695c' },
            others: { bg: '#eceff1', color: '#455a64' }
        };
        const s = colorMap[t] || colorMap.others;
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{type || '-'}</span>;
    };

    // Scroll restocked row into view when restockedId is set
    useEffect(() => {
        if (!restockedId) return;
        const el = document.getElementById(`row-${restockedId}`);
        if (el && el.scrollIntoView) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }, [restockedId]);

    const handleDelete = async (id) => {
        await deleteProduct(id);
        // Refresh product list
        await loadProducts();
    };

    const openRestockModal = (product) => {
        setRestockTarget(product);
        setRestockQty('1');
        setRestockError('');
        // default supplier selection to product.supplier if available
        setSelectedSupplier(product && product.supplier ? String(product.supplier) : '');
        setRestockModalOpen(true);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            if (!prev) return [id];
            const has = prev.includes(id);
            if (has) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const openEditModal = (product) => {
        setEditTarget(product);
        setEditForm({
            brand: product.brand || '',
            model: product.model || product.name || '',
            price: product.price || '',
            cost: product.cost || '',
            stock: product.stock || 0,
            accessoryType: product.accessoryType || ''
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditTarget(null);
        setEditForm({ brand: '', model: '', price: '', cost: '', stock: '', accessoryType: '' });
    };

    const submitEdit = async () => {
        if (!editTarget) return;
        const payload = {
            brand: editForm.brand,
            model: editForm.model,
            price: Number(editForm.price || 0),
            cost: Number(editForm.cost || 0),
            stock: Number(editForm.stock || 0),
            // always include accessoryType so items added earlier without it can be updated
            accessoryType: editForm.accessoryType || ''
        };
        try {
            await updateProduct(editTarget._id, payload);
            await loadProducts();
            closeEditModal();
            alert('Product updated');
        } catch (err) {
            console.error('Update failed', err);
            alert(err && err.message ? err.message : 'Failed to update product');
        }
    };

    const closeRestockModal = () => {
        setRestockModalOpen(false);
        setRestockTarget(null);
        setRestockQty('1');
        setRestockError('');
    };

    const submitRestock = async () => {
        const qty = parseInt(restockQty, 10);
        if (isNaN(qty) || qty <= 0) {
            setRestockError('Enter a valid positive quantity');
            return;
        }
        try {
            await restockProduct(restockTarget._id, qty, selectedSupplier || undefined);
            await loadProducts();
            // bring restocked product to attention
            setRestockedId(restockTarget._id);
            // clear highlight after 6s
            setTimeout(() => setRestockedId(''), 6000);
            closeRestockModal();
            alert(`Added ${qty} units to ${restockTarget.brand} ${restockTarget.model}`);
        } catch (err) {
            console.error(err);
            setRestockError('Failed to restock. Try again.');
        }
    };

    const openAddSupplier = () => {
        setSupplierCreateError('');
        setNewSupplierName('');
        setNewSupplierPhone('');
        setNewSupplierEmail('');
        setSupplierModalOpen(true);
    };

    const submitNewSupplier = async () => {
        if (!newSupplierName || !newSupplierPhone) {
            setSupplierCreateError('Name and phone are required');
            return;
        }
        try {
            const created = await addSupplier({ name: newSupplierName, phone: newSupplierPhone, email: newSupplierEmail });
            // refresh supplier list and select new supplier
            const s = await getSuppliers();
            setSuppliers(s);
            setSelectedSupplier(created._id);
            setSupplierModalOpen(false);
        } catch (err) {
            console.error(err);
            setSupplierCreateError(err.message || 'Failed to create supplier');
        }
    };

    // Prepare ordering: restocked item on top, then low-stock, then normal
    const orderedProducts = (() => {
        try {
            const byId = new Map(filteredProducts.map(p => [p._id, p]));
            const restocked = restockedId && byId.get(restockedId) ? [byId.get(restockedId)] : [];
            const lowStock = filteredProducts.filter(p => p._id !== restockedId && p.stock < 5).sort((a,b) => a.stock - b.stock);
            const normal = filteredProducts.filter(p => p._id !== restockedId && p.stock >= 5 && !lowStock.includes(p));
            return [...restocked, ...lowStock, ...normal];
        } catch (e) {
            return filteredProducts;
        }
    })();

    return (
        <div className="card">
            <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', boxShadow: '0 1px 0 rgba(0,0,0,0.06)', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#333' }}>Current Inventory</h2>
                    <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>
                        Inventory Value: <strong>Rs. {Number(totalInventoryValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
                        &nbsp;•&nbsp;Retail Value: <strong>Rs. {Number(totalRetailValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
                        &nbsp;•&nbsp;Total Units: <strong>{totalInventoryUnits.toLocaleString()}</strong>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 13, color: '#444', marginRight: 8 }}>View:</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => { setViewFilter('all'); setAccessoryFilter(''); }} style={{ padding: '6px 10px', borderRadius: 6, border: viewFilter === 'all' ? '1px solid #1976d2' : '1px solid #ddd', background: viewFilter === 'all' ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>All</button>
                            <button onClick={() => { setViewFilter('phones'); setAccessoryFilter(''); }} style={{ padding: '6px 10px', borderRadius: 6, border: viewFilter === 'phones' ? '1px solid #1976d2' : '1px solid #ddd', background: viewFilter === 'phones' ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>Phones</button>
                            <button onClick={() => setViewFilter('accessories')} style={{ padding: '6px 10px', borderRadius: 6, border: viewFilter === 'accessories' ? '1px solid #1976d2' : '1px solid #ddd', background: viewFilter === 'accessories' ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>Accessories</button>
                        </div>
                        {viewFilter === 'accessories' && (
                            <div style={{ marginLeft: 12 }}>
                                <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>Accessory Type</label>
                                <select value={accessoryFilter} onChange={(e) => setAccessoryFilter(e.target.value)} style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd' }}>
                                    <option key="all" value="">-- All types --</option>
                                    {ACCESSORY_TYPES.map((t, i) => <option key={`${t}-${i}`} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                        )}
                        {/* Quick search by brand, model, accessory type, or barcode */}
                        <div style={{ marginLeft: 12 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 6 }}>Search</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="search"
                                    placeholder="Search brand, model, type or barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '8px', borderRadius: 6, border: '1px solid #ddd', minWidth: 260 }}
                                />
                                <button onClick={() => setSearchTerm('')} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Clear</button>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={onAddClick} style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Add New Product
                </button>
            </div>

            {restockModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 360, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0 }}>Restock: {restockTarget && `${restockTarget.brand} ${restockTarget.model}`}</h3>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Quantity to add</label>
                            <input autoFocus type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                            {restockError && <div style={{ color: '#d32f2f', marginTop: 6 }}>{restockError}</div>}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Supplier (optional)</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={{ flex: 1, padding: '8px', fontSize: 14 }}>
                                    <option value="">-- Select supplier --</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                                <button onClick={openAddSupplier} style={{ padding: '8px 10px', borderRadius: 6, border: 'none', background: '#4caf50', color: '#fff', cursor: 'pointer' }}>+ Add</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={closeRestockModal} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>Cancel</button>
                            <button onClick={submitRestock} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff' }}>Add</button>
                        </div>
                    </div>
                </div>
            )}

            {supplierModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0 }}>Add Supplier</h3>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                            <input type="text" value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Phone</label>
                            <input type="text" value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Email (optional)</label>
                            <input type="email" value={newSupplierEmail} onChange={(e) => setNewSupplierEmail(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        {supplierCreateError && <div style={{ color: '#d32f2f', marginBottom: 10 }}>{supplierCreateError}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setSupplierModalOpen(false)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>Cancel</button>
                            <button onClick={submitNewSupplier} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff' }}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: '60vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', width: 48 }}>Select</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Model</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>IMEI</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Accessory Type</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Date Added</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Investor</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'right' }}>Cost</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'right' }}>Stock</th>
                        {/* New Column for Barcode */}
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', textAlign: 'center' }}>Barcode</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 ? (
                        <tr><td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No products found. Add one!</td></tr>
                    ) : (
                        orderedProducts.map(p => {
                            const isNew = newestIds.includes(p._id);
                            const isRestocked = restockedId === p._id;
                            const rowBackground = (p.stock === 0) ? '#ffebee' : (isRestocked ? '#e8f5e9' : (isNew ? '#fff8e1' : 'transparent'));
                            const badgeBg = (p.stock === 0) ? '#ffcdd2' : (p.stock < 5 ? '#fff3e0' : '#e8f5e9');
                            const badgeColor = (p.stock === 0) ? '#b71c1c' : (p.stock < 5 ? '#ef6c00' : '#2e7d32');
                            return (
                                <tr id={`row-${p._id}`} key={p._id} style={{ borderBottom: '1px solid #eee', backgroundColor: rowBackground }}>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => toggleSelect(p._id)} />
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <strong>{p.brand}</strong><br/>
                                    {p.model}
                                </td>
                                <td style={{ padding: '12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderImei(p)}</td>
                                <td style={{ padding: '12px' }}>{isAccessory(p) ? renderAccessoryBadge(p.accessoryType || '-') : '-'}</td>
                                <td style={{ padding: '12px' }}>{formatItemDate(p)}</td>
                                <td style={{ padding: '12px' }}>{p.investorName ? p.investorName : '-'}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>Rs. {Number(p.price).toFixed(2)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>Rs. {Number(p.cost || 0).toFixed(2)}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <span style={{ backgroundColor: badgeBg, color: badgeColor, padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {p.stock} units
                                    </span>
                                </td>
                                {/* Render Barcode Here */}
                                <td style={{ padding: '5px', textAlign: 'center' }}>
                                    {p.barcode ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Barcode 
                                                value={p.barcode} 
                                                height={30} 
                                                width={1} 
                                                fontSize={12}
                                                margin={0}
                                                id={`barcode-${p._id}`}
                                            />
                                            <button
                                                aria-label={`Print barcode ${p._id}`}
                                                style={{ marginTop: 6, fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                                                                                                onClick={() => {
                                                                                                        const printWindow = window.open('', '', 'width=400,height=200');
                                                                                                        const barcodeElem = document.getElementById(`barcode-${p._id}`);
                                                                                                        const barcodeSvg = barcodeElem ? barcodeElem.outerHTML : '';
                                                                                                        const safeModel = (p.model || '').replace(/</g, '&lt;');
                                                                                                        const safePrice = `Rs. ${Number(p.price || 0).toFixed(2)}`;
                                                                                                        const html = `<!doctype html>
                                                                                                            <html>
                                                                                                                <head>
                                                                                                                    <meta charset="utf-8" />
                                                                                                                    <title>Print Barcode</title>
                                                                                                                    <style>
                                                                                                                        @page { size: 38mm 25mm; margin: 0; }
                                                                                                                        html, body { margin: 0; padding: 0; }
                                                                                                                        .label { width: 38mm; height: 25mm; display:flex; flex-direction:column; justify-content:center; align-items:center; box-sizing: border-box; }
                                                                                                                        .model { font-family: Arial, Helvetica, sans-serif; font-weight:700; font-size:4mm; color:#222; margin-bottom:1mm; }
                                                                                                                        .price { font-family: Arial, Helvetica, sans-serif; font-size:3.5mm; color:#444; margin-top:1mm; }
                                                                                                                        .barcode-svg { width: calc(100% - 6mm) !important; height: 12mm !important; }
                                                                                                                        /* reset margins for svg elements inside */
                                                                                                                        .label svg { display:block; margin:0; }
                                                                                                                    </style>
                                                                                                                </head>
                                                                                                                <body>
                                                                                                                    <div class="label">
                                                                                                                        <div class="model">${safeModel}</div>
                                                                                                                        ${barcodeSvg}
                                                                                                                        <div class="price">${safePrice}</div>
                                                                                                                    </div>
                                                                                                                </body>
                                                                                                            </html>`;
                                                                                                        printWindow.document.open();
                                                                                                        printWindow.document.write(html);
                                                                                                        printWindow.document.close();
                                                                                                        printWindow.focus();
                                                                                                        // allow time for resources / svg to render
                                                                                                        setTimeout(() => { printWindow.print(); printWindow.close(); }, 600);
                                                                                                }}
                                                                                        >Print</button>
                                        </div>
                                    ) : (
                                        <span style={{fontSize: '12px', color: '#ccc'}}>No Barcode</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button onClick={() => openRestockModal(p)} style={BTN_PRIMARY}>Restock</button>

                                        <button onClick={() => openEditModal(p)} style={BTN_ACCENT}>Edit</button>

                                        <button onClick={async () => {
                                            if (window.confirm('Are you sure you want to delete this product?')) {
                                                try {
                                                    await handleDelete(p._id);
                                                } catch (err) {
                                                    alert('Failed to delete product');
                                                }
                                            }
                                        }} style={BTN_DANGER}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ backgroundColor: '#fafafa', textAlign: 'left' }}>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee' }} colSpan={6}><strong>Totals</strong></td>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee', textAlign: 'right' }}><strong>Rs. {Number(totalRetailValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee', textAlign: 'right' }}><strong>Rs. {Number(totalInventoryValue).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee', textAlign: 'right' }}><strong>{totalInventoryUnits.toLocaleString()} units</strong></td>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee' }}></td>
                        <td style={{ padding: '12px', borderTop: '2px solid #eee' }}></td>
                    </tr>
                </tfoot>
            </table>
            </div>
            {editModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
                    <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 480, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0 }}>Edit: {editTarget && `${editTarget.brand || ''} ${editTarget.model || ''}`}</h3>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Brand</label>
                            <input type="text" value={editForm.brand} onChange={(e) => setEditForm({...editForm, brand: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Model / Name</label>
                            <input type="text" value={editForm.model} onChange={(e) => setEditForm({...editForm, model: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        {editTarget && (isAccessory(editTarget) || ('accessoryType' in editTarget) || viewFilter === 'accessories') && (
                            <div style={{ marginBottom: 10 }}>
                                <label style={{ display: 'block', marginBottom: 6 }}>Accessory Type</label>
                                <select value={editForm.accessoryType} onChange={(e) => setEditForm({...editForm, accessoryType: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }}>
                                    <option key="none" value="">-- Select type --</option>
                                    {ACCESSORY_TYPES.map((t,i) => <option key={`edit-${t}-${i}`} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: 6 }}>Price</label>
                                <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: 6 }}>Cost</label>
                                <input type="number" value={editForm.cost} onChange={(e) => setEditForm({...editForm, cost: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                            </div>
                        </div>
                        <div style={{ marginTop: 10 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Stock</label>
                            <input type="number" value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <button onClick={closeEditModal} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>Cancel</button>
                            <button onClick={submitEdit} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductListDesktop;