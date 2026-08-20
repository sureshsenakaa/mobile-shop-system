import React, { useState } from 'react';
import { addSupplier, getSuppliers } from '../api/supplierApi';

const SupplierModal = ({ isOpen, onClose, onSupplierAdded }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [warrantyTerms, setWarrantyTerms] = useState('');
    const [brands, setBrands] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name || !phone) {
            setError('Name and phone are required');
            return;
        }
        try {
            const brandsArray = brands.split(',').map(b => b.trim()).filter(b => b.length > 0);
            const created = await addSupplier({ name, phone, email, warrantyTerms, brands: brandsArray });
            const s = await getSuppliers();
            onSupplierAdded(s, created._id);
            // Reset state
            setName('');
            setPhone('');
            setEmail('');
            setWarrantyTerms('');
            setBrands('');
            setError('');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to create supplier');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <h3 style={{ marginTop: 0 }}>Add Supplier</h3>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Phone</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Email (optional)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Brands (Optional)</label>
                        <input type="text" placeholder="e.g. Apple" value={brands} onChange={(e) => setBrands(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Warranty</label>
                        <input type="text" placeholder="e.g. 1 Year" value={warrantyTerms} onChange={(e) => setWarrantyTerms(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                    </div>
                </div>
                {error && <div style={{ color: '#d32f2f', marginBottom: 10 }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' }}>Create</button>
                </div>
            </div>
        </div>
    );
};

export default SupplierModal;
