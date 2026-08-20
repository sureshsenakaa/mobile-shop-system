import React, { useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { getParts, deletePart, updatePart } from '../api/partApi';
import { CATEGORIES } from './PartCategoryGrid';
import BarcodePrinter from './BarcodePrinter';

const PartListDesktop = ({ onAddClick, onBack, filterCategory }) => {
    const [parts, setParts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [printTarget, setPrintTarget] = useState(null);

    // Find category info
    const categoryInfo = CATEGORIES.find(c => c.key === filterCategory) || { key: 'All', label: 'All Parts', emoji: '⚙️', color: '#673ab7' };

    useEffect(() => {
        const fetchParts = async () => {
            const data = await getParts();
            setParts(data);
        };
        fetchParts();
    }, []);

    // Filter parts by category
    const filteredParts = filterCategory
        ? parts.filter(p => (p.category || 'Other') === filterCategory)
        : parts;

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this part?')) {
            try {
                await deletePart(id);
                setParts(parts.filter(p => p._id !== id));
            } catch (error) {
                console.error(error);
                alert('Failed to delete part.');
            }
        }
    };

    const handleEditClick = (part) => {
        setEditingId(part._id);
        setEditFormData({ 
            partName: part.partName,
            phoneModel: part.phoneModel,
            sku: part.sku,
            quantity: part.quantity,
            cost: part.cost,
            category: part.category || 'Other'
        });
    };

    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSave = async (id) => {
        const payload = { ...editFormData, cost: parseFloat(editFormData.cost), quantity: parseInt(editFormData.quantity) };
        try {
            await updatePart(id, payload);
            setParts(parts.map(p => p._id === id ? { ...p, ...payload } : p));
        } catch (error) {
            console.error(error);
            alert('Failed to update part.');
        }
        setEditingId(null);
    };

    const cellInputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{ backgroundColor: '#f1f1f1', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ← Back to Categories
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>{categoryInfo.emoji}</span>
                        <div>
                            <h2 style={{ margin: 0, color: '#333' }}>{categoryInfo.label} Parts</h2>
                            <span style={{ 
                                fontSize: '13px', color: categoryInfo.color, fontWeight: '600',
                                backgroundColor: categoryInfo.color + '15', padding: '2px 10px', 
                                borderRadius: '12px', display: 'inline-block', marginTop: '4px'
                            }}>
                                {filteredParts.length} parts | {filteredParts.reduce((s, p) => s + (p.quantity || 0), 0)} units
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={onAddClick} style={{ backgroundColor: categoryInfo.color || '#673ab7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Add {categoryInfo.label} Part
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>SKU</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Barcode</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Part Name</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Phone Model</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Cost</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Qty</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', width: '200px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredParts.map(p => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                            {editingId === p._id ? (
                                <>
                                    <td style={{ padding: '12px' }}><input name="sku" value={editFormData.sku} onChange={handleEditFormChange} style={cellInputStyle} /></td>
                                    <td style={{ padding: '12px' }}>
                                        {p.barcode ? (
                                            <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                                                <Barcode value={p.barcode} height={30} width={1} displayValue={true} fontSize={12} margin={0} />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '12px' }}><input name="partName" value={editFormData.partName} onChange={handleEditFormChange} style={cellInputStyle} /></td>
                                    <td style={{ padding: '12px' }}><input name="phoneModel" value={editFormData.phoneModel} onChange={handleEditFormChange} style={cellInputStyle} /></td>
                                    <td style={{ padding: '12px' }}><input type="number" name="cost" value={editFormData.cost} onChange={handleEditFormChange} style={cellInputStyle} /></td>
                                    <td style={{ padding: '12px' }}><input type="number" name="quantity" value={editFormData.quantity} onChange={handleEditFormChange} style={cellInputStyle} /></td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => handleEditSave(p._id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.sku}</td>
                                    <td style={{ padding: '12px' }}>
                                        {p.barcode ? (
                                            <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
                                                <Barcode value={p.barcode} height={30} width={1} displayValue={true} fontSize={12} margin={0} />
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '12px' }}>{p.partName}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{p.phoneModel || '-'}</td>
                                    <td style={{ padding: '12px' }}>Rs. {p.cost}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: p.quantity > 5 ? '#e8f5e9' : '#ffebee', color: p.quantity > 5 ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>
                                            {p.quantity}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => setPrintTarget({ ...p, brand: p.partName, name: p.phoneModel || '', price: p.cost })} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Print Barcode">🖨️</button>
                                        <button onClick={() => handleEditClick(p)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(p._id)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    {filteredParts.length === 0 && <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No parts in this category.</td></tr>}
                </tbody>
            </table>

            {/* Barcode Printer Modal */}
            {printTarget && (
                <BarcodePrinter 
                    product={printTarget} 
                    onClose={() => setPrintTarget(null)} 
                />
            )}
        </div>
    );
};

export default PartListDesktop;

