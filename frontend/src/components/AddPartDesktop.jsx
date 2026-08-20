import React, { useState } from 'react';
import { createPart } from '../api/partApi';
import { CATEGORIES } from './PartCategoryGrid';

const AddPartDesktop = ({ onPartAdded, onCancel, defaultCategory }) => {
    const [form, setForm] = useState({ 
        partName: '', phoneModel: '', quantity: 1, cost: 0,
        category: defaultCategory || 'Other'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, quantity: parseInt(form.quantity) || 1, cost: parseFloat(form.cost) || 0 };
            await createPart(payload);
            onPartAdded();
        } catch (error) {
            console.error('createPart error', error);
            const errMsg = error.response && error.response.data && error.response.data.error ? error.response.data.error : 'Failed to add part.';
            alert(errMsg);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '8px 0 20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };

    // Find category info for display
    const selectedCat = CATEGORIES.find(c => c.key === form.category);

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>Add Repair Part</h2>
            
            {/* Category Badge */}
            {selectedCat && (
                <div style={{ 
                    textAlign: 'center', marginBottom: '20px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{ fontSize: '24px' }}>{selectedCat.emoji}</span>
                    <span style={{ 
                        backgroundColor: selectedCat.color + '20', color: selectedCat.color,
                        padding: '4px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '14px'
                    }}>
                        {selectedCat.label}
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label style={{ fontWeight: 'bold', color: '#555' }}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>
                    ))}
                </select>

                <label style={{ fontWeight: 'bold', color: '#555' }}>Part Name</label>
                <input required style={inputStyle} placeholder="e.g., LCD Screen" value={form.partName} onChange={e => setForm({...form, partName: e.target.value})} />

                <label style={{ fontWeight: 'bold', color: '#555' }}>Phone Model</label>
                <input style={inputStyle} placeholder="e.g., Samsung S21" value={form.phoneModel} onChange={e => setForm({...form, phoneModel: e.target.value})} />
                
                <label style={{ fontWeight: 'bold', color: '#555' }}>Cost (Rs.)</label>
                <input required type="number" style={inputStyle} placeholder="0.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />

                <label style={{ fontWeight: 'bold', color: '#555' }}>Quantity</label>
                <input required type="number" style={inputStyle} placeholder="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: '#673ab7', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Add Part</button>
                </div>
            </form>
        </div>
    );
};

export default AddPartDesktop;
