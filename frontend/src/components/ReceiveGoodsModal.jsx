import React, { useState } from 'react';
import { API_BASE_URL } from '../api/config';

const ReceiveGoodsModal = ({ po, onClose, onSuccess }) => {
    // Build initial state: for each item, track isPhoneMode (toggle), imeiText, confirmed
    const [itemStates, setItemStates] = useState(() => {
        const init = {};
        (po.items || []).forEach((item, idx) => {
            // Default: treat as phone if productType/isPhone says so, otherwise accessory
            const defaultPhone = item.isPhone === true || item.productType === 'Phone';
            init[idx] = {
                isPhoneMode: defaultPhone,
                imeiText: '',
                confirmed: false
            };
        });
        return init;
    });
    const [submitting, setSubmitting] = useState(false);

    const getImeis = (idx) => {
        const text = itemStates[idx]?.imeiText || '';
        return text.split(/[\s,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    };

    const handleTogglePhoneMode = (idx, value) => {
        setItemStates(prev => ({
            ...prev,
            [idx]: { ...prev[idx], isPhoneMode: value, imeiText: '', confirmed: false }
        }));
    };

    const handleImeiChange = (idx, value) => {
        setItemStates(prev => ({
            ...prev,
            [idx]: { ...prev[idx], imeiText: value }
        }));
    };

    const handleConfirmChange = (idx, value) => {
        setItemStates(prev => ({
            ...prev,
            [idx]: { ...prev[idx], confirmed: value }
        }));
    };

    const isItemValid = (item, idx) => {
        const state = itemStates[idx];
        if (state?.isPhoneMode) {
            const imeis = getImeis(idx);
            return imeis.length === Number(item.quantity);
        }
        return state?.confirmed === true;
    };

    const allValid = (po.items || []).every((item, idx) => isItemValid(item, idx));

    const handleConfirm = async () => {
        if (!allValid) return;
        setSubmitting(true);

        // Build updated items with imeiList attached
        const updatedItems = (po.items || []).map((item, idx) => {
            const state = itemStates[idx];
            if (state?.isPhoneMode) {
                return { ...item, imeiList: getImeis(idx), isPhone: true, productType: 'Phone' };
            }
            return { ...item, isPhone: false, productType: 'Accessories' };
        });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/purchase-orders/${po.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Received', items: updatedItems })
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to receive goods');
            }
        } catch (err) {
            alert('Error receiving goods');
        } finally {
            setSubmitting(false);
        }
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000
    };

    const modalStyle = {
        background: 'white',
        borderRadius: 12,
        padding: 28,
        width: '90%',
        maxWidth: 620,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    };

    return (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>📦 Receive Goods — PO-{po.id}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
                </div>

                {(po.items || []).map((item, idx) => {
                    const state = itemStates[idx] || {};
                    const isPhoneMode = state.isPhoneMode;
                    const imeis = isPhoneMode ? getImeis(idx) : [];
                    const qty = Number(item.quantity);
                    const imeiCount = imeis.length;
                    const imeiMatch = imeiCount === qty;
                    const valid = isItemValid(item, idx);

                    return (
                        <div key={idx} style={{
                            border: `2px solid ${valid ? '#22c55e' : '#e2e8f0'}`,
                            borderRadius: 10,
                            padding: 16,
                            marginBottom: 16,
                            background: valid ? '#f0fdf4' : '#f8fafc',
                            transition: 'all 0.2s'
                        }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, marginBottom: 8 }}>
                                        {item.productName}
                                    </div>
                                    {/* Phone / Accessory Toggle */}
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePhoneMode(idx, true)}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                border: 'none',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: isPhoneMode ? '#dbeafe' : '#f1f5f9',
                                                color: isPhoneMode ? '#1d4ed8' : '#94a3b8',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            📱 Phone (IMEI)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTogglePhoneMode(idx, false)}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                border: 'none',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: !isPhoneMode ? '#fce7f3' : '#f1f5f9',
                                                color: !isPhoneMode ? '#9d174d' : '#94a3b8',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            🎧 Accessory
                                        </button>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Qty Ordered</div>
                                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>{qty}</div>
                                </div>
                            </div>

                            {/* Content based on mode */}
                            {isPhoneMode ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <label style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                                            IMEIs (comma, space, or newline separated)
                                        </label>
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: imeiMatch ? '#16a34a' : (imeiCount > qty ? '#dc2626' : '#64748b'),
                                            background: imeiMatch ? '#dcfce7' : (imeiCount > qty ? '#fee2e2' : '#f1f5f9'),
                                            padding: '2px 10px',
                                            borderRadius: 8
                                        }}>
                                            {imeiCount}/{qty} {imeiMatch ? '✅' : ''}
                                        </span>
                                    </div>
                                    <textarea
                                        rows={Math.max(3, qty + 1)}
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: 7,
                                            border: `1.5px solid ${imeiMatch ? '#22c55e' : '#cbd5e1'}`,
                                            fontFamily: 'monospace',
                                            fontSize: 13,
                                            resize: 'vertical',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            background: '#fff'
                                        }}
                                        placeholder={qty > 1
                                            ? `IMEI 1\nIMEI 2\n... (${qty} total)`
                                            : 'Scan or type IMEI here...'
                                        }
                                        value={state.imeiText || ''}
                                        onChange={e => handleImeiChange(idx, e.target.value)}
                                    />
                                    {!imeiMatch && imeiCount > 0 && (
                                        <div style={{ color: imeiCount > qty ? '#dc2626' : '#f59e0b', fontSize: 12, marginTop: 4 }}>
                                            {imeiCount > qty
                                                ? `⚠️ Extra IMEIs — remove ${imeiCount - qty}`
                                                : `⏳ ${qty - imeiCount} more IMEI${qty - imeiCount > 1 ? 's' : ''} needed`
                                            }
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginTop: 4 }}>
                                    <input
                                        type="checkbox"
                                        checked={state.confirmed || false}
                                        onChange={e => handleConfirmChange(idx, e.target.checked)}
                                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }}
                                    />
                                    <span style={{ fontSize: 14, color: '#374151' }}>
                                        Confirm receiving {qty} unit{qty > 1 ? 's' : ''} of this accessory
                                    </span>
                                </label>
                            )}
                        </div>
                    );
                })}

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 8,
                            border: '1.5px solid #cbd5e1', background: 'white',
                            color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!allValid || submitting}
                        style={{
                            flex: 2, padding: '12px', borderRadius: 8,
                            border: 'none',
                            background: allValid ? '#16a34a' : '#94a3b8',
                            color: 'white', fontWeight: 700, fontSize: 15,
                            cursor: allValid && !submitting ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s'
                        }}
                    >
                        {submitting ? '⏳ Processing...' : allValid ? '✅ Confirm Receive Goods' : '⏳ Complete all items above'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiveGoodsModal;
