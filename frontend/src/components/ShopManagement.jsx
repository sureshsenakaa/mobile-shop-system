import React, { useState, useEffect } from 'react';
import { getShops, createShop, updateShop, createShopAdmin, deleteShop } from '../api/shopApi';
import { getRevenueStats, getGlobalNotice, updateGlobalNotice } from '../api/adminApi';

const ShopManagement = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New Shop Form
    const [name, setName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    
    // New Admin Form
    const [adminUsername, setAdminUsername] = useState('');
    const [selectedShopId, setSelectedShopId] = useState(null);
    const [generatedPassword, setGeneratedPassword] = useState('');

    // Dashboard Stats
    const [stats, setStats] = useState({ totalRevenue: 0, mrr: 0 });
    const [noticeText, setNoticeText] = useState('');

    // Inline Rename
    const [editingShopId, setEditingShopId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editOwner, setEditOwner] = useState('');

    const loadShops = async () => {
        setLoading(true);
        try {
            const [data, revStats, noticeData] = await Promise.all([
                getShops(),
                getRevenueStats(),
                getGlobalNotice()
            ]);
            setShops(data);
            if (revStats) setStats(revStats);
            if (noticeData && noticeData.message) setNoticeText(noticeData.message);
        } catch (err) {
            console.error('Failed to load shops', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadShops();
    }, []);

    const handleCreateShop = async (e) => {
        e.preventDefault();
        try {
            await createShop({ name, ownerName });
            setName('');
            setOwnerName('');
            loadShops();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setGeneratedPassword('');
        if (!selectedShopId) return alert('Select a shop first');
        try {
            const res = await createShopAdmin(selectedShopId, { username: adminUsername });
            setAdminUsername('');
            setSelectedShopId(null);
            if (res.temporaryPassword) {
                setGeneratedPassword(res.temporaryPassword);
            } else {
                alert('Shop admin created successfully');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleStatus = async (shop) => {
        try {
            await updateShop(shop.id, { isActive: !shop.isActive });
            loadShops();
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleBilling = async (shop) => {
        try {
            const newStatus = shop.billingStatus === 'overdue' ? 'active' : 'overdue';
            await updateShop(shop.id, { billingStatus: newStatus });
            loadShops();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateGlobalNotice(noticeText);
            alert('Broadcast message updated successfully!');
        } catch (err) {
            alert(err.message);
        }
    };

    const startEditing = (shop) => {
        setEditingShopId(shop.id);
        setEditName(shop.name);
        setEditOwner(shop.ownerName || '');
    };

    const cancelEditing = () => {
        setEditingShopId(null);
        setEditName('');
        setEditOwner('');
    };

    const handleRenameShop = async (shopId) => {
        if (!editName.trim()) return alert('Shop name cannot be empty');
        try {
            await updateShop(shopId, { name: editName.trim(), ownerName: editOwner.trim() });
            cancelEditing();
            loadShops();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteShop = async (shop) => {
        const confirmText = prompt(
            `⚠️ WARNING: This will permanently delete "${shop.name}" and ALL its data including:\n` +
            `- All Products, Sales, Repairs\n` +
            `- All Customers, Suppliers, Expenses\n` +
            `- All Staff Accounts\n\n` +
            `Type the shop name "${shop.name}" to confirm deletion:`
        );
        if (confirmText !== shop.name) {
            if (confirmText !== null) alert('Shop name did not match. Deletion cancelled.');
            return;
        }
        try {
            await deleteShop(shop.id);
            alert(`"${shop.name}" and all related data deleted successfully.`);
            loadShops();
        } catch (err) {
            alert(err.message);
        }
    };

    const totalShops = shops.length;
    const activeShops = shops.filter(s => s.isActive).length;
    const overdueShops = shops.filter(s => s.billingStatus === 'overdue').length;

    return (
        <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Shopping Mall - Super Admin Dashboard</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 30 }}>
                <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>MRR (This Month)</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0 0 0', color: '#16a34a' }}>Rs. {stats.mrr?.toLocaleString() || 0}</p>
                </div>
                <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>Total Revenue</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0 0 0', color: 'var(--primary)' }}>Rs. {stats.totalRevenue?.toLocaleString() || 0}</p>
                </div>
                <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>Total Shops</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0 0 0', color: '#475569' }}>{totalShops}</p>
                </div>
                <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ color: '#888', margin: 0, fontSize: 14, textTransform: 'uppercase' }}>Overdue</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0 0 0', color: '#dc2626' }}>{overdueShops}</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 30 }}>
                {/* Create Shop Form */}
                <div style={{ flex: '1 1 300px', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Add New Shop</h3>
                    <form onSubmit={handleCreateShop}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Shop Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Owner Name</label>
                            <input value={ownerName} onChange={e => setOwnerName(e.target.value)} style={{ width: '100%', padding: 8 }} />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>Create Shop</button>
                    </form>
                </div>

                {/* Create Admin Form */}
                <div style={{ flex: '1 1 300px', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Create Shop Admin</h3>
                    <form onSubmit={handleCreateAdmin}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Select Shop</label>
                            <select value={selectedShopId || ''} onChange={e => setSelectedShopId(e.target.value)} required style={{ width: '100%', padding: 8 }}>
                                <option value="" disabled>-- Select a shop --</option>
                                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Admin Username</label>
                            <input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>Create Admin Account</button>
                    </form>

                    {generatedPassword && (
                        <div style={{ marginTop: 20, padding: 15, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#166534', fontWeight: 'bold' }}>Admin Created Successfully!</p>
                            <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#15803d' }}>Share this temporary password with the shop owner. They will be forced to change it on their first login.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input readOnly value={generatedPassword} style={{ flex: 1, padding: 8, background: '#fff', border: '1px solid #ddd', fontWeight: 'bold', letterSpacing: 2 }} />
                                <button onClick={() => { navigator.clipboard.writeText(generatedPassword); alert('Copied!'); }} className="btn btn-ghost" style={{ background: '#fff' }}>Copy</button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Notice Board */}
                <div style={{ flex: '1 1 300px', background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Broadcast Notice Board</h3>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 15 }}>This message will be visible to all logged-in shop users.</p>
                    <form onSubmit={handleNoticeSubmit}>
                        <textarea 
                            value={noticeText} 
                            onChange={e => setNoticeText(e.target.value)} 
                            placeholder="e.g. System maintenance scheduled for tonight at 12 AM."
                            style={{ width: '100%', padding: 10, minHeight: 100, marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }} 
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Update Broadcast Message</button>
                    </form>
                </div>
            </div>

            <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <h3>All Shops</h3>
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Name</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Owner</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Last Active</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Status</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Billing</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shops.map(shop => (
                                <tr key={shop.id}>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{shop.id}</td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                                        {editingShopId === shop.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                <input 
                                                    value={editName} 
                                                    onChange={e => setEditName(e.target.value)} 
                                                    style={{ padding: 6, border: '2px solid var(--primary)', borderRadius: 4, fontWeight: 'bold' }}
                                                    autoFocus
                                                    placeholder="Shop Name"
                                                />
                                                <input 
                                                    value={editOwner} 
                                                    onChange={e => setEditOwner(e.target.value)} 
                                                    style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                                                    placeholder="Owner Name"
                                                />
                                            </div>
                                        ) : shop.name}
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        {editingShopId === shop.id ? (
                                            <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>editing...</span>
                                        ) : (shop.ownerName || '-')}
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee', fontSize: 12, color: '#666' }}>
                                        {shop.lastActive ? new Date(shop.lastActive).toLocaleString() : 'Never'}
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: 12, 
                                            fontSize: 12, 
                                            fontWeight: 'bold',
                                            backgroundColor: shop.isActive ? '#e8f5e9' : '#ffebee',
                                            color: shop.isActive ? '#2e7d32' : '#c62828'
                                        }}>
                                            {shop.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: 12, 
                                            fontSize: 12, 
                                            fontWeight: 'bold',
                                            backgroundColor: shop.billingStatus === 'overdue' ? '#ffebee' : '#e8f5e9',
                                            color: shop.billingStatus === 'overdue' ? '#c62828' : '#2e7d32'
                                        }}>
                                            {shop.billingStatus === 'overdue' ? 'Overdue' : 'Paid'}
                                        </span>
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {editingShopId === shop.id ? (
                                                <>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => handleRenameShop(shop.id)}
                                                        style={{ color: '#2e7d32', padding: '4px 8px', fontSize: 12, background: '#e8f5e9', borderRadius: 6 }}
                                                    >
                                                        ✓ Save
                                                    </button>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={cancelEditing}
                                                        style={{ color: '#666', padding: '4px 8px', fontSize: 12 }}
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => startEditing(shop)}
                                                        style={{ color: 'var(--primary)', padding: '4px 8px', fontSize: 12 }}
                                                    >
                                                        ✏️ Rename
                                                    </button>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => toggleStatus(shop)}
                                                        style={{ color: shop.isActive ? '#c62828' : '#2e7d32', padding: '4px 8px', fontSize: 12 }}
                                                    >
                                                        {shop.isActive ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => toggleBilling(shop)}
                                                        style={{ color: shop.billingStatus === 'overdue' ? '#2e7d32' : '#c62828', padding: '4px 8px', fontSize: 12 }}
                                                    >
                                                        {shop.billingStatus === 'overdue' ? 'Mark Paid' : 'Mark Overdue'}
                                                    </button>
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        onClick={() => handleDeleteShop(shop)}
                                                        style={{ color: '#fff', backgroundColor: '#dc2626', padding: '4px 8px', fontSize: 12, borderRadius: 6 }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shops.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#888' }}>No shops found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ShopManagement;
