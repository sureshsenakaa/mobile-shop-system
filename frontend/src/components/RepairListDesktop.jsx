import React, { useEffect, useState } from 'react';
import { getRepairs, deleteRepair, updateRepair } from '../api/repairApi';
import { getParts, updatePart } from '../api/partApi';
import PatternLock from './PatternLock';

const RepairListDesktop = ({ onAddClick, onManageParts }) => {
    const [repairs, setRepairs] = useState([]);
    const [parts, setParts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const [repairsData, partsData] = await Promise.all([getRepairs(), getParts()]);
            setRepairs(repairsData);
            setParts(partsData);
        };
        fetchData();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        const updatedRepairs = repairs.map(r => r._id === id ? { ...r, status: newStatus } : r);
        setRepairs(updatedRepairs);
        try {
            await updateRepair(id, { status: newStatus });
        } catch (error) {
            alert('Failed to update status.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this repair ticket?')) {
            try {
                await deleteRepair(id);
                setRepairs(repairs.filter(r => r._id !== id));
            } catch (error) {
                alert('Failed to delete ticket.');
            }
        }
    };

    const handleEditClick = (repair) => {
        setEditingId(repair._id);
        setEditFormData({ 
            serviceType: repair.serviceType || 'Carry In',
            brand: repair.brand || '',
            device: repair.device || '',
            issue: repair.issue || '',
            assignedTechnician: repair.assignedTechnician || '',
            cost: repair.cost || 0,
            status: repair.status || 'Pending',
            usedParts: repair.usedParts || [],
            newPartSku: '',
            newPartQty: 1
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPartToTicket = async () => {
        const sku = editFormData.newPartSku;
        const qty = parseInt(editFormData.newPartQty) || 1;
        if (!sku) return alert("Select a part");
        
        const part = parts.find(p => p.sku === sku);
        if (!part) return alert("Part not found");
        if (part.quantity < qty) return alert("Not enough quantity in stock");

        const usedPart = { sku: part.sku, partName: part.partName, quantity: qty, cost: part.cost };
        const updatedPartsList = [...(editFormData.usedParts || []), usedPart];
        
        setEditFormData(prev => ({ ...prev, usedParts: updatedPartsList, newPartSku: '', newPartQty: 1 }));
    };

    const handleEditSave = async (id) => {
        const payload = { 
            ...editFormData, 
            cost: parseFloat(editFormData.cost) || 0 
        };
        delete payload.newPartSku;
        delete payload.newPartQty;

        try {
            await updateRepair(id, payload);
            setRepairs(repairs.map(r => r._id === id ? { ...r, ...payload } : r));
            
            // Re-fetch parts in case inventory was modified (if backend handles deduction, though right now backend doesn't automatically deduct. We'd have to deduct manually here, but for now we just track them on the ticket).
        } catch (error) {
            alert('Failed to save changes.');
        }
        setEditingId(null);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Complete': return '#e8f5e9'; 
            case 'Waiting Parts': return '#ffebee';
            default: return '#fff3e0'; // Pending
        }
    };

    const cellInputStyle = { padding: '6px', borderRadius: '4px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>🔧 Repair Jobs</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onManageParts} style={{ backgroundColor: '#673ab7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ⚙️ Manage Parts Inventory
                    </button>
                    <button onClick={onAddClick} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + New Repair Ticket
                    </button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Ticket #</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Customer</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Device & Issue</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Technician</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Cost & Parts</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Status</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee', width: '130px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {repairs.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid #eee' }}>
                            {editingId === r._id ? (
                                <>
                                    <td style={{ padding: '12px', color: '#888' }}>{r.repairId || `#${r._id.toString().slice(-4)}`}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '700' }}>{r.customerName}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.customerMobile}</div>
                                        <select name="serviceType" value={editFormData.serviceType} onChange={handleEditFormChange} style={{...cellInputStyle, marginTop: '5px'}}>
                                            <option value="Carry In">Carry In</option>
                                            <option value="Pick Up">Pick Up</option>
                                            <option value="On Site">On Site</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <input name="brand" value={editFormData.brand} onChange={handleEditFormChange} placeholder="Brand" style={{...cellInputStyle, marginBottom: '5px'}} />
                                        <input name="device" value={editFormData.device} onChange={handleEditFormChange} placeholder="Device" style={{...cellInputStyle, marginBottom: '5px'}} />
                                        <textarea name="issue" value={editFormData.issue} onChange={handleEditFormChange} placeholder="Issue" style={{...cellInputStyle, height: '50px'}} />
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <input name="assignedTechnician" value={editFormData.assignedTechnician} onChange={handleEditFormChange} placeholder="Tech Name" style={cellInputStyle} />
                                    </td>
                                    <td style={{ padding: '12px', minWidth: '200px' }}>
                                        <div style={{ marginBottom: '5px' }}>Total Cost: <input type="number" name="cost" value={editFormData.cost} onChange={handleEditFormChange} style={{...cellInputStyle, width: '80px', display: 'inline'}} /></div>
                                        <div style={{ fontSize: '12px', backgroundColor: '#f9f9f9', padding: '5px', borderRadius: '4px' }}>
                                            <strong>Used Parts:</strong>
                                            {(editFormData.usedParts || []).map((p, i) => (
                                                <div key={i}>- {p.partName} (x{p.quantity})</div>
                                            ))}
                                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                <select name="newPartSku" value={editFormData.newPartSku} onChange={handleEditFormChange} style={{...cellInputStyle, width: 'auto'}}>
                                                    <option value="">Select Part</option>
                                                    {parts.map(p => <option key={p.sku} value={p.sku}>{p.partName} ({p.quantity} in stock)</option>)}
                                                </select>
                                                <input type="number" name="newPartQty" value={editFormData.newPartQty} onChange={handleEditFormChange} style={{...cellInputStyle, width: '50px'}} />
                                                <button type="button" onClick={handleAddPartToTicket} style={{ padding: '5px', cursor: 'pointer' }}>Add</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <select name="status" value={editFormData.status} onChange={handleEditFormChange} style={{ ...cellInputStyle, backgroundColor: getStatusColor(editFormData.status), fontWeight: 'bold' }}>
                                            <option value="Pending">Pending</option>
                                            <option value="Waiting Parts">Waiting Parts</option>
                                            <option value="Complete">Complete</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => handleEditSave(r._id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{ padding: '12px', color: '#888', fontWeight: 'bold' }}>{r.repairId || `#${r._id.toString().slice(-4)}`}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '700' }}>{r.customerName || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.customerMobile || '-'}</div>
                                        <div style={{ fontSize: '11px', color: '#007bff', marginTop: '4px' }}>{r.serviceType}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div><strong>{r.brand} {r.device}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{r.issue}</div>
                                        {r.lockCredential && r.lockCredential.startsWith('PATTERN:') ? (
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px', fontWeight: 'bold' }}>Lock Pattern:</div>
                                                <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: 240 * 0.25, height: 240 * 0.25 }}>
                                                    <PatternLock readOnly={true} initialPattern={r.lockCredential.replace('PATTERN:', '').split('-').map(Number)} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '11px', backgroundColor: '#e3f2fd', color: '#0d47a1', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                🔒 {r.lockCredential ? r.lockCredential : 'No Passcode'}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div>{r.assignedTechnician || 'Unassigned'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 'bold' }}>Rs. {r.cost}</div>
                                        {r.usedParts && r.usedParts.length > 0 && (
                                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                Parts: {r.usedParts.map(p => p.partName).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <select value={r.status || 'Pending'} onChange={(e) => handleStatusChange(r._id, e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd', backgroundColor: getStatusColor(r.status), fontWeight: 'bold', cursor: 'pointer' }}>
                                            <option value="Pending">Pending</option>
                                            <option value="Waiting Parts">Waiting Parts</option>
                                            <option value="Complete">Complete</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => handleEditClick(r)} style={{ marginRight: '5px', marginBottom: '5px', padding: '5px 10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={() => handleDelete(r._id)} style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                        <div style={{ marginTop: '5px' }}>
                                            <a href={`/tracking?ticket=${r.repairId || r._id}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#673ab7', textDecoration: 'none', fontWeight: 'bold' }}>🔗 Track Link</a>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    {repairs.length === 0 && <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No active repairs.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default RepairListDesktop;