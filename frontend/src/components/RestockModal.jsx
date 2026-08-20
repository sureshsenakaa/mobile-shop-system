import React, { useState, useEffect } from 'react';
import { restockProduct } from '../api/productApi';

const RestockModal = ({ isOpen, target, onClose, onRestocked, suppliers = [], openAddSupplier, selectedSupplier, setSelectedSupplier }) => {
    const isAccessory = target ? !!(target.accessoryType || target.category === 'Accessories' || target.isAccessory) : false;
    const hasExistingImeis = target ? (!isAccessory && Array.isArray(target.imeiList) && target.imeiList.length > 0) : false;

    const [restockMode, setRestockMode] = useState('qty'); // 'qty' | 'imei'
    const [qty, setQty] = useState('1');
    const [imeiText, setImeiText] = useState('');
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && target) {
            setQty('1');
            setImeiText('');
            setError('');
            setSaving(false);
            setCost(target.cost !== undefined && target.cost !== null ? String(target.cost) : '');
            setPrice(target.price !== undefined && target.price !== null ? String(target.price) : '');
            
            // Accessories always use quantity mode
            if (target.accessoryType || target.category === 'Accessories') {
                setRestockMode('qty');
            } else if (Array.isArray(target.imeiList) && target.imeiList.length > 0) {
                setRestockMode('imei');
            } else {
                setRestockMode('qty');
            }

            if (target.supplier) {
                setSelectedSupplier(String(target.supplier));
            } else {
                setSelectedSupplier('');
            }
        }
    }, [isOpen, target, setSelectedSupplier]);

    if (!isOpen || !target) return null;

    const currentStock = Number(target.stock) || 0;
    const currentCost = Number(target.cost) || 0;

    let addQty = 0;
    if (restockMode === 'imei') {
        addQty = imeiText.split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 0).length;
    } else {
        addQty = parseInt(qty, 10) || 0;
    }

    const enteredBatchCost = (cost !== '' && !isNaN(Number(cost))) ? Number(cost) : currentCost;

    let liveAverageCost = currentCost;
    if (currentStock <= 0) {
        liveAverageCost = enteredBatchCost;
    } else if (addQty > 0) {
        const totalVal = (currentStock * currentCost) + (addQty * enteredBatchCost);
        liveAverageCost = Math.round((totalVal / (currentStock + addQty)) * 100) / 100;
    }

    const isCostChanged = (cost !== '' && !isNaN(Number(cost)) && Number(cost) !== currentCost && addQty > 0);

    const handleSubmit = async () => {
        let finalQty = 0;
        let imeiList = [];
        setError('');

        if (restockMode === 'imei') {
            imeiList = imeiText.split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 0);
            if (imeiList.length === 0) {
                setError('Please enter at least one IMEI.');
                return;
            }
            finalQty = imeiList.length;
        } else {
            finalQty = parseInt(qty, 10);
            if (isNaN(finalQty) || finalQty <= 0) {
                setError('Please enter a valid positive quantity.');
                return;
            }
        }

        if (cost !== '' && (isNaN(Number(cost)) || Number(cost) < 0)) {
            setError('Please enter a valid cost price (Rs.)');
            return;
        }

        if (price !== '' && (isNaN(Number(price)) || Number(price) < 0)) {
            setError('Please enter a valid selling price (Rs.)');
            return;
        }

        setSaving(true);
        try {
            await restockProduct(
                target._id || target.id, 
                finalQty, 
                selectedSupplier || undefined, 
                imeiList.length > 0 ? imeiList : undefined,
                cost !== '' ? cost : undefined,
                price !== '' ? price : undefined
            );
            onRestocked(target._id || target.id, finalQty);
            onClose();
        } catch (err) {
            console.error('Restock error:', err);
            setError(err.message || 'Failed to restock. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: 12, width: 440, maxWidth: '92vw', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: 'bold' }}>
                            📦 Restock: {target.brand} {target.model}
                        </h3>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            {target.accessoryType ? (
                                <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>
                                    🏷️ {target.accessoryType} (Accessory)
                                </span>
                            ) : (
                                <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>
                                    📱 Device / Phone
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>
                                Current Stock: <strong>{target.stock || 0}</strong>
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                </div>

                {/* If Phone/Device, give choice between Quantity vs IMEI Scan */}
                {!isAccessory && (
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 14 }}>
                        <button
                            type="button"
                            onClick={() => setRestockMode('qty')}
                            style={{
                                flex: 1,
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: 6,
                                background: restockMode === 'qty' ? '#ffffff' : 'transparent',
                                color: restockMode === 'qty' ? '#0f172a' : '#64748b',
                                fontWeight: restockMode === 'qty' ? 'bold' : 'normal',
                                boxShadow: restockMode === 'qty' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            🔢 By Quantity
                        </button>
                        <button
                            type="button"
                            onClick={() => setRestockMode('imei')}
                            style={{
                                flex: 1,
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: 6,
                                background: restockMode === 'imei' ? '#ffffff' : 'transparent',
                                color: restockMode === 'imei' ? '#0f172a' : '#64748b',
                                fontWeight: restockMode === 'imei' ? 'bold' : 'normal',
                                boxShadow: restockMode === 'imei' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                fontSize: '13px'
                            }}
                        >
                            📋 Scan / Enter IMEIs
                        </button>
                    </div>
                )}

                {/* Stock Input */}
                <div style={{ marginBottom: 14 }}>
                    {restockMode === 'imei' && !isAccessory ? (
                        <>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                                IMEIs to add (One per line)
                            </label>
                            <textarea 
                                autoFocus
                                style={{ width: '100%', padding: '10px', fontSize: 13, height: '90px', resize: 'vertical', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} 
                                placeholder="Scan or type IMEIs here..." 
                                value={imeiText} 
                                onChange={(e) => setImeiText(e.target.value)} 
                            />
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                                Stock quantity will automatically equal the number of IMEIs entered.
                            </p>
                        </>
                    ) : (
                        <>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                                Quantity to add (Units)
                            </label>
                            <input 
                                autoFocus 
                                type="number" 
                                min="1" 
                                value={qty} 
                                onChange={(e) => setQty(e.target.value)} 
                                placeholder="e.g. 10"
                                style={{ width: '100%', padding: '10px', fontSize: 14, border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} 
                            />
                        </>
                    )}
                </div>

                {/* Cost Price & Selling Price Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                            New Batch Cost (Rs.)
                        </label>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={cost} 
                            onChange={(e) => setCost(e.target.value)} 
                            placeholder="Buying Cost"
                            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', background: '#f8fafc' }} 
                        />
                        <span style={{ fontSize: 10, color: '#64748b' }}>Current: Rs. {currentCost.toFixed(2)}</span>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                            Selling Price (Rs.)
                        </label>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)} 
                            placeholder="Retail Price"
                            style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', background: '#f8fafc' }} 
                        />
                        <span style={{ fontSize: 10, color: '#64748b' }}>Current: Rs. {Number(target.price || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Weighted Average Cost Calculation Preview */}
                {isCostChanged && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#14532d' }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>📊 Weighted Average Cost:</span>
                            <span style={{ fontSize: 13, color: '#15803d' }}>Rs. {liveAverageCost.toFixed(2)} / unit</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                            ({currentStock} old units @ Rs. {currentCost.toFixed(2)} + {addQty} new units @ Rs. {enteredBatchCost.toFixed(2)}) ÷ {currentStock + addQty} total units
                        </div>
                    </div>
                )}

                {/* Supplier Field */}
                <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 4 }}>
                        Supplier (optional)
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select 
                            value={selectedSupplier} 
                            onChange={(e) => setSelectedSupplier(e.target.value)} 
                            style={{ flex: 1, padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
                        >
                            <option value="">-- Select supplier --</option>
                            {suppliers.map(s => (
                                <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                            ))}
                        </select>
                        {openAddSupplier && (
                            <button 
                                type="button" 
                                onClick={openAddSupplier} 
                                style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}
                            >
                                + Add
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={saving}
                        style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={saving}
                        style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: '600', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? '⏳ Restocking...' : '📦 Restock Product'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestockModal;
