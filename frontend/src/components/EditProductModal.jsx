import React, { useState, useEffect } from 'react';
import { updateProduct } from '../api/productApi';
import { PHONE_BRANDS, PHONE_MODELS } from '../utils/phoneCatalog';

const ACCESSORY_TYPES = ['tempered','backcover','charger','cable','earphone','speaker','powerbank','Others'];

const EditProductModal = ({ isOpen, target, onClose, onUpdated, viewFilter }) => {
    const [editForm, setEditForm] = useState({ brand: '', model: '', price: '', cost: '', stock: '', accessoryType: '', ram: '', storage: '', color: '' });

    useEffect(() => {
        if (isOpen && target) {
            setEditForm({
                brand: target.brand || '',
                model: target.model || target.name || '',
                price: target.price || '',
                cost: target.cost || '',
                stock: target.stock || 0,
                accessoryType: target.accessoryType || '',
                ram: target.ram || '',
                storage: target.storage || '',
                color: target.color || ''
            });
        }
    }, [isOpen, target]);

    if (!isOpen || !target) return null;

    const isAccessory = (p) => {
        if (!p) return false;
        if (p.type && String(p.type).toLowerCase() === 'accessories') return true;
        if (p.type && String(p.type).toLowerCase() === 'phone') return false;
        if (p.imeiList || p.imei || p.imei1 || p.imei2 || p.serialNumber) return false;
        return true; // Fallback
    };

    const submitEdit = async () => {
        const payload = {
            brand: editForm.brand,
            model: editForm.model,
            price: Number(editForm.price || 0),
            cost: Number(editForm.cost || 0),
            stock: Number(editForm.stock || 0),
            accessoryType: editForm.accessoryType || '',
            ram: editForm.ram || '',
            storage: editForm.storage || '',
            color: editForm.color || ''
        };
        try {
            await updateProduct(target._id, payload);
            onUpdated();
            onClose();
            alert('Product updated');
        } catch (err) {
            console.error('Update failed', err);
            alert(err && err.message ? err.message : 'Failed to update product');
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 480, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <h3 style={{ marginTop: 0 }}>Edit: {`${target.brand || ''} ${target.model || ''}`}</h3>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Brand</label>
                    <input list="edit-brand-options" type="text" value={editForm.brand} onChange={(e) => setEditForm({...editForm, brand: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14, boxSizing: 'border-box' }} />
                    <datalist id="edit-brand-options">
                        {PHONE_BRANDS.map((b, i) => <option key={i} value={b} />)}
                    </datalist>
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 6 }}>Model / Name</label>
                    <input list="edit-model-options" type="text" value={editForm.model} onChange={(e) => setEditForm({...editForm, model: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14, boxSizing: 'border-box' }} />
                    {editForm.brand && PHONE_MODELS[editForm.brand] && (
                        <datalist id="edit-model-options">
                            {PHONE_MODELS[editForm.brand].map((m, i) => <option key={i} value={m} />)}
                        </datalist>
                    )}
                </div>
                
                {isAccessory(target) ? (
                    <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>Accessory Type</label>
                        <select value={editForm.accessoryType} onChange={(e) => setEditForm({...editForm, accessoryType: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }}>
                            <option key="none" value="">-- Select type --</option>
                            {ACCESSORY_TYPES.map((t,i) => <option key={`edit-${t}-${i}`} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>RAM</label>
                            <input type="text" value={editForm.ram} onChange={(e) => setEditForm({...editForm, ram: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Storage</label>
                            <input type="text" value={editForm.storage} onChange={(e) => setEditForm({...editForm, storage: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>Color</label>
                            <input type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14 }} />
                        </div>
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
                    <input type="number" readOnly={!isAccessory(target) && target.imeiList?.length > 0} title={!isAccessory(target) && target.imeiList?.length > 0 ? "Stock is auto-calculated based on available IMEIs" : ""} value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} style={{ width: '100%', padding: '8px', fontSize: 14, backgroundColor: (!isAccessory(target) && target.imeiList?.length > 0) ? '#f0f0f0' : 'white' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={submitEdit} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' }}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
