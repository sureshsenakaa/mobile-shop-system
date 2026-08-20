import React, { useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { getProducts, deleteProduct } from '../api/productApi';
import { getSuppliers } from '../api/supplierApi';
import EditProductModal from './EditProductModal';
import RestockModal from './RestockModal';
import SupplierModal from './SupplierModal';
import BarcodePrinter from './BarcodePrinter';
import BulkUploadModal from './BulkUploadModal';

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
    const [restockImeiText, setRestockImeiText] = useState('');
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
    const [printTarget, setPrintTarget] = useState(null);
    const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
    const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'phones' | 'accessories'
    const [accessoryFilter, setAccessoryFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadProducts = async () => {
        try {
            const products = await getProducts();
            setProducts(products);
            // compute newest 5 by ObjectId timestamp
            try {
                const sorted = [...products].sort((a,b) => b.id - a.id);
                const topIds = sorted.slice(0,5).map(p => p._id);
                setNewestIds(topIds);
            } catch (err) {
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
        if (p.type && String(p.type).toLowerCase() === 'accessories') return true;
        if (p.type && String(p.type).toLowerCase() === 'phones') return false;
        // fallback
        if (p.accessoryType) return true;
        if (p.ram || p.storage) return false;
        return false;
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
        if (!p._id) return 0;
        return p.id || p._id; // Fallback to id/ObjectId
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
        if (!type || type.trim() === '') return null;
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
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{type}</span>;
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
        setRestockImeiText('');
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

    const onSupplierAdded = (updatedSuppliers, newId) => {
        setSuppliers(updatedSuppliers);
        setSelectedSupplier(newId);
        setSupplierModalOpen(false);
    };

    const handleRestockSuccess = (id, qty) => {
        loadProducts();
        setRestockedId(id);
        setTimeout(() => setRestockedId(''), 6000);
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
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setBulkUploadModalOpen(true)} style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📥 Bulk Upload (Excel)
                    </button>
                    <button onClick={onAddClick} style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Add New Product
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Added</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Item</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Specs</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>IMEI / SN</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Barcode</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Financials</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Stock</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderedProducts.map(p => (
                            <tr key={p._id || p.id} id={`row-${p._id || p.id}`} style={{ borderBottom: '1px solid #eee', background: restockedId === (p._id || p.id) ? '#e8f5e9' : 'transparent', transition: 'background 1s' }}>
                                <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{formatItemDate(p)}</td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{p.brand} {p.model || p.name}</div>
                                    {isAccessory(p) && <div style={{ marginTop: 4 }}>{renderAccessoryBadge(p.accessoryType)}</div>}
                                    {p.supplierName && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Supplier: {p.supplierName}</div>}
                                    {p.investorName && <div style={{ fontSize: 12, color: '#ff8f00', fontWeight: 'bold' }}>Inv: {p.investorName}</div>}
                                </td>
                                <td style={{ padding: '12px', fontSize: 13, color: '#555' }}>
                                    {!isAccessory(p) ? (
                                        <>
                                            <div>RAM: {p.ram || '-'}</div>
                                            <div>Storage: {p.storage || '-'}</div>
                                            <div>Color: {p.color || '-'}</div>
                                        </>
                                    ) : (
                                        <div>Color: {p.color || '-'}</div>
                                    )}
                                </td>
                                <td style={{ padding: '12px', fontSize: 13, color: '#555', maxWidth: 150, wordWrap: 'break-word' }}>
                                    {renderImei(p)}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {p.barcode ? (
                                        <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                                            <Barcode value={p.barcode} height={30} width={1} displayValue={true} fontSize={12} margin={0} />
                                        </div>
                                    ) : '-'}
                                </td>
                                <td style={{ padding: '12px', fontSize: 13 }}>
                                    <div>Cost: <strong style={{ color: '#d32f2f' }}>Rs. {Number(p.cost || 0).toLocaleString()}</strong></div>
                                    <div>Price: <strong style={{ color: '#388e3c' }}>Rs. {Number(p.price || 0).toLocaleString()}</strong></div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontSize: 18, fontWeight: 'bold', color: p.stock < 5 ? '#d32f2f' : '#333' }}>
                                        {p.stock}
                                    </div>
                                    {p.stock < 5 && <div style={{ fontSize: 11, color: '#d32f2f', fontWeight: 'bold' }}>LOW STOCK</div>}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 160 }}>
                                        <button style={{...BTN_PRIMARY, flex: '1 1 45%', padding: '6px 4px'}} onClick={() => openRestockModal(p)}>📦 Add</button>
                                        <button style={{...BTN_ACCENT, flex: '1 1 45%', padding: '6px 4px'}} onClick={() => openEditModal(p)}>✏️ Edit</button>
                                        <button style={{...BTN_BASE, flex: '1 1 45%', padding: '6px 4px', backgroundColor: '#f5f5f5', border: '1px solid #ddd'}} onClick={() => setPrintTarget(p)}>🖨️ Print</button>
                                        <button style={{...BTN_DANGER, flex: '1 1 45%', padding: '6px 4px'}} onClick={() => { if(window.confirm('Delete this product?')) handleDelete(p.id || p._id); }}>🗑️ Del</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orderedProducts.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                    No products found matching the criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RestockModal 
                isOpen={restockModalOpen}
                target={restockTarget}
                onClose={() => { setRestockModalOpen(false); setRestockTarget(null); }}
                onRestocked={handleRestockSuccess}
                suppliers={suppliers}
                openAddSupplier={() => setSupplierModalOpen(true)}
                selectedSupplier={selectedSupplier}
                setSelectedSupplier={setSelectedSupplier}
            />

            <SupplierModal 
                isOpen={supplierModalOpen}
                onClose={() => setSupplierModalOpen(false)}
                onSupplierAdded={onSupplierAdded}
            />

            <EditProductModal 
                isOpen={editModalOpen}
                target={editTarget}
                onClose={() => { setEditModalOpen(false); setEditTarget(null); }}
                onUpdated={loadProducts}
                viewFilter={viewFilter}
            />

            <BarcodePrinter 
                product={printTarget}
                onClose={() => setPrintTarget(null)}
            />

            <BulkUploadModal 
                isOpen={bulkUploadModalOpen} 
                onClose={() => setBulkUploadModalOpen(false)} 
                onSuccess={() => { loadProducts(); setBulkUploadModalOpen(false); }} 
            />
        </div>
    );
};

export default ProductListDesktop;