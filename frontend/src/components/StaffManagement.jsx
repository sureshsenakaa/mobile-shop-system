import React, { useState, useEffect } from 'react';
import { getStaff, createStaff, deleteStaff, updateStaff } from '../api/userApi';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New Staff Form
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [basicSalary, setBasicSalary] = useState(0);
    const [commissionRateSales, setCommissionRateSales] = useState(0);
    const [commissionRateRepairs, setCommissionRateRepairs] = useState(0);

    // Edit Staff State
    const [editingStaffId, setEditingStaffId] = useState(null);
    const [editPermissions, setEditPermissions] = useState([]);
    const [editBasicSalary, setEditBasicSalary] = useState(0);
    const [editCommissionRateSales, setEditCommissionRateSales] = useState(0);
    const [editCommissionRateRepairs, setEditCommissionRateRepairs] = useState(0);

    const togglePermission = (perm) => {
        if (permissions.includes(perm)) {
            setPermissions(permissions.filter(p => p !== perm));
        } else {
            setPermissions([...permissions, perm]);
        }
    };

    const loadStaff = async () => {
        setLoading(true);
        try {
            const data = await getStaff();
            setStaff(data);
        } catch (err) {
            console.error('Failed to load staff', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await createStaff({ 
                username, 
                password, 
                permissions, 
                basicSalary: parseFloat(basicSalary) || 0,
                commissionRateSales: parseFloat(commissionRateSales) || 0, 
                commissionRateRepairs: parseFloat(commissionRateRepairs) || 0 
            });
            setUsername('');
            setPassword('');
            setPermissions([]);
            setBasicSalary(0);
            setCommissionRateSales(0);
            setCommissionRateRepairs(0);
            loadStaff();
            alert('Staff member created');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await deleteStaff(id);
            loadStaff();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEditClick = (user) => {
        setEditingStaffId(user.id);
        setEditPermissions([...(user.permissions || [])]);
        setEditBasicSalary(user.basicSalary || 0);
        setEditCommissionRateSales(user.commissionRateSales || 0);
        setEditCommissionRateRepairs(user.commissionRateRepairs || 0);
    };

    const handleSaveEdit = async () => {
        try {
            await updateStaff(editingStaffId, { 
                permissions: editPermissions,
                basicSalary: parseFloat(editBasicSalary) || 0,
                commissionRateSales: parseFloat(editCommissionRateSales) || 0,
                commissionRateRepairs: parseFloat(editCommissionRateRepairs) || 0
            });
            setEditingStaffId(null);
            loadStaff();
            alert('Staff permissions updated');
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleEditPermission = (perm) => {
        if (editPermissions.includes(perm)) {
            setEditPermissions(editPermissions.filter(p => p !== perm));
        } else {
            setEditPermissions([...editPermissions, perm]);
        }
    };

    return (
        <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Staff Management</h2>
            
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 30 }}>
                {/* Create Staff Form */}
                <div style={{ flex: '1 1 300px', maxWidth: 400, background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3>Add New Staff</h3>
                    <form onSubmit={handleCreateStaff}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Username</label>
                            <input value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Basic Salary (Rs.)</label>
                            <input type="number" min="0" step="100" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} style={{ width: '100%', padding: 8 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Sales Comm. (%)</label>
                                <input type="number" min="0" max="100" value={commissionRateSales} onChange={e => setCommissionRateSales(e.target.value)} style={{ width: '100%', padding: 8 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Repair Comm. (%)</label>
                                <input type="number" min="0" max="100" value={commissionRateRepairs} onChange={e => setCommissionRateRepairs(e.target.value)} style={{ width: '100%', padding: 8 }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Permissions</label>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>
                                <input type="checkbox" checked={permissions.includes('delete_sales')} onChange={() => togglePermission('delete_sales')} /> Can Delete Sales
                            </label>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>
                                <input type="checkbox" checked={permissions.includes('view_reports')} onChange={() => togglePermission('view_reports')} /> Can View Reports
                            </label>
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>Create Staff Account</button>
                    </form>
                </div>
            </div>

            <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3>My Shop's Staff</h3>
                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Username</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Role</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Created</th>
                                <th style={{ padding: 10, borderBottom: '1px solid #ddd' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(user => {
                                const isEditing = editingStaffId === user.id;
                                return (
                                <tr key={user.id}>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{user.id}</td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: 12, 
                                            fontSize: 12, 
                                            fontWeight: 'bold',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1565c0',
                                            marginRight: 10
                                        }}>
                                            {user.role}
                                        </span>
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 10 }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <label style={{ fontSize: 11 }}><input type="checkbox" checked={editPermissions.includes('delete_sales')} onChange={() => toggleEditPermission('delete_sales')} /> delete sales</label>
                                                    <label style={{ fontSize: 11 }}><input type="checkbox" checked={editPermissions.includes('view_reports')} onChange={() => toggleEditPermission('view_reports')} /> view reports</label>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <label style={{ fontSize: 11 }}>Basic Salary: <br/><input type="number" value={editBasicSalary} onChange={e => setEditBasicSalary(e.target.value)} style={{width: 80, padding: 4}} /></label>
                                                    <label style={{ fontSize: 11 }}>Sales Comm %: <br/><input type="number" value={editCommissionRateSales} onChange={e => setEditCommissionRateSales(e.target.value)} style={{width: 60, padding: 4}} /></label>
                                                    <label style={{ fontSize: 11 }}>Repair Comm %: <br/><input type="number" value={editCommissionRateRepairs} onChange={e => setEditCommissionRateRepairs(e.target.value)} style={{width: 60, padding: 4}} /></label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div>
                                                    {user.permissions && user.permissions.map(p => (
                                                        <span key={p} style={{ fontSize: 11, background: '#eee', padding: '2px 6px', borderRadius: 4, marginRight: 5 }}>
                                                            {p.replace('_', ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ fontSize: 11, marginTop: 4, color: '#666' }}>
                                                    Rs. {user.basicSalary || 0} basic | {user.commissionRateSales || 0}% sales | {user.commissionRateRepairs || 0}% repairs
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{new Date(user.dateCreated).toLocaleDateString()}</td>
                                    <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                        {isEditing ? (
                                            <>
                                                <button className="btn" style={{ padding: '4px 8px', fontSize: 12, marginRight: 5 }} onClick={handleSaveEdit}>Save</button>
                                                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setEditingStaffId(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn btn-ghost" onClick={() => handleEditClick(user)} style={{ color: '#1565c0', padding: '4px 8px', fontSize: 12, marginRight: 5 }}>Edit</button>
                                                <button className="btn btn-ghost" onClick={() => handleDelete(user.id)} style={{ color: '#c62828', padding: '4px 8px', fontSize: 12 }}>Remove</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#888' }}>No staff found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default StaffManagement;
