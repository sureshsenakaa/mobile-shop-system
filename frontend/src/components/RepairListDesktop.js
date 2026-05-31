// File: src/components/RepairListDesktop.js

import React, { useEffect, useState } from 'react';
import { getRepairs, deleteRepair, updateRepair } from '../api/repairApi';

const RepairListDesktop = ({ onAddClick }) => {
    const [repairs, setRepairs] = useState([]);
    // State to hold the ID of the repair currently being edited, or null if none.
    const [editingId, setEditingId] = useState(null);
    // State to hold the temporary data while editing.
    const [editFormData, setEditFormData] = useState({});

    // --- Data Management Functions ---

    // Load repairs from backend
    useEffect(() => {
        const fetchRepairs = async () => {
            const repairsData = await getRepairs();
            setRepairs(repairsData);
        };
        fetchRepairs();
    }, []);

    // Helper function to update state only
    const updateRepairsState = (newRepairs) => {
        setRepairs(newRepairs);
    };

    // Function to change status (Pending -> Completed)
    const handleStatusChange = async (id, newStatus) => {
        const updatedRepairs = repairs.map(repair => 
            repair._id === id ? { ...repair, status: newStatus } : repair
        );
        updateRepairsState(updatedRepairs);
        try {
            await updateRepair(id, { status: newStatus });
        } catch (error) {
            // revert local change on failure
            const reverted = repairs.map(repair => repair._id === id ? { ...repair, status: repair.status } : repair);
            setRepairs(reverted);
            alert('Failed to update status in database.');
        }
    };

    // Function to handle deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this repair ticket?')) {
            try {
                await deleteRepair(id);
                setRepairs(repairs.filter(repair => repair._id !== id));
            } catch (error) {
                console.error('deleteRepair error', error);
                alert('Failed to delete repair ticket.');
            }
        }
    };

    // Function to start the edit process
    const handleEditClick = (repair) => {
        setEditingId(repair._id);
        // Load the current repair data into the form state
        setEditFormData({ 
            customerName: repair.customerName,
            customerMobile: repair.customerMobile,
            device: repair.device,
            issue: repair.issue,
            cost: repair.cost,
            status: repair.status
        });
    };

    // Handler for changes in the edit form inputs
    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    // Function to save the edited repair data
    // NOTE: This only updates locally. To persist, you need to implement updateRepair in the backend and API.
    const handleEditSave = (id) => {
        const payload = { ...editFormData, cost: parseFloat(editFormData.cost) || 0 };
        // Optimistically update UI
        const updatedRepairs = repairs.map(repair => 
            repair._id === id ? { ...repair, ...payload } : repair
        );
        updateRepairsState(updatedRepairs);
        // Persist change
        (async () => {
            try {
                await updateRepair(id, payload);
            } catch (error) {
                console.error('updateRepair error', error);
                alert('Failed to save changes to repair ticket.');
                // Reload list from server to be safe
                const refreshed = await getRepairs();
                setRepairs(refreshed);
            }
        })();
        // Exit editing mode
        setEditingId(null);
        setEditFormData({});
    };

    // --- Styling Helpers ---

    // Helper for status colors
    const getStatusColor = (status) => {
        switch(status) {
            case 'Completed': return '#e8f5e9'; // Green
            case 'In Progress': return '#e3f2fd'; // Blue
            case 'Delivered': return '#eeeeee'; // Grey
            default: return '#fff3e0'; // Orange/Yellow (Pending)
        }
    };

    // Common style for input fields within the table
    const cellInputStyle = {
        padding: '8px', 
        borderRadius: '4px', 
        border: '1px solid #ddd',
        width: 'calc(100% - 16px)', // Adjust width for padding
        boxSizing: 'border-box'
    };

    // --- Component Render ---

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>🔧 Repair Jobs</h2>
                <button onClick={onAddClick} style={{ backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + New Repair Ticket
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        {[
                            <th key="ticket" style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Ticket #</th>,
                            <th key="customer" style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Customer</th>,
                            <th key="device" style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Device & Issue</th>,
                            <th key="cost" style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Cost</th>,
                            <th key="status" style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Status</th>,
                            <th key="actions" style={{ padding: '12px', borderBottom: '2px solid #eee', width: '120px' }}>Actions</th>
                        ]}
                    </tr>
                </thead>
                <tbody>
                    {repairs.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid #eee' }}>
                            {/* Conditional Rendering: Edit Form vs. Display Row */}
                            {editingId === r._id ? (
                                // --- EDIT MODE ---
                                [
                                    <td key="ticket" style={{ padding: '12px', color: '#888' }}>#{r._id.toString().slice(-4)}</td>,
                                    <td key="customer" style={{ padding: '12px' }}>
                                        <input 
                                            type="text" 
                                            name="customerName" 
                                            value={editFormData.customerName || ''} 
                                            onChange={handleEditFormChange} 
                                            style={cellInputStyle}
                                        />
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                                            <label style={{ fontWeight: '600', marginRight: '6px' }}>Mobile:</label>
                                            <input type="text" name="customerMobile" value={editFormData.customerMobile || ''} readOnly disabled style={{ ...cellInputStyle, marginTop: '6px' }} />
                                        </div>
                                    </td>,
                                    <td key="device" style={{ padding: '12px' }}>
                                        <input 
                                            type="text" 
                                            name="device" 
                                            value={editFormData.device || ''} 
                                            onChange={handleEditFormChange} 
                                            style={{...cellInputStyle, marginBottom: '5px'}}
                                        />
                                        <input 
                                            type="text" 
                                            name="issue" 
                                            value={editFormData.issue || ''} 
                                            onChange={handleEditFormChange} 
                                            style={cellInputStyle}
                                        />
                                    </td>,
                                    <td key="cost" style={{ padding: '12px' }}>
                                        <input 
                                            type="number" 
                                            name="cost" 
                                            value={editFormData.cost || 0} 
                                            onChange={handleEditFormChange} 
                                            style={cellInputStyle}
                                        />
                                    </td>,
                                    <td key="status" style={{ padding: '12px' }}>
                                        <select 
                                            name="status"
                                            value={editFormData.status || 'Pending'}
                                            onChange={handleEditFormChange}
                                            style={{ 
                                                ...cellInputStyle, 
                                                backgroundColor: getStatusColor(editFormData.status),
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>,
                                    <td key="actions" style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleEditSave(r._id)}
                                            style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={() => setEditingId(null)}
                                            style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                ]
                            ) : (
                                // --- DISPLAY MODE ---
                                [
                                    <td key="ticket" style={{ padding: '12px', color: '#888' }}>#{r._id.toString().slice(-4)}</td>,
                                    <td key="customer" style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '700' }}>{r.customerName || 'Unknown'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.customerMobile || '-'}</div>
                                    </td>,
                                    <td key="device" style={{ padding: '12px' }}>
                                        <div><strong>{r.device}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{r.issue}</div>
                                    </td>,
                                    <td key="cost" style={{ padding: '12px' }}>Rs. {r.cost}</td>,
                                    <td key="status" style={{ padding: '12px' }}>
                                        <select 
                                            value={r.status || 'Pending'}
                                            onChange={(e) => handleStatusChange(r._id, e.target.value)}
                                            style={{ 
                                                padding: '5px', 
                                                borderRadius: '4px', 
                                                border: '1px solid #ddd',
                                                backgroundColor: getStatusColor(r.status),
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>,
                                    <td key="actions" style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleEditClick(r)}
                                            style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(r._id)}
                                            style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                ]
                            )}
                        </tr>
                    ))}
                    {repairs.length === 0 && <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No active repairs.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default RepairListDesktop;