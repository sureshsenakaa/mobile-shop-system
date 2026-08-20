import React, { useState, useEffect } from 'react';
import { createRepair } from '../api/repairApi';
import { getCustomers, addCustomer } from '../api/customerApi';
import PatternLock from './PatternLock';

const AddRepairDesktop = ({ onRepairAdded, onCancel }) => {
    const [form, setForm] = useState({ 
        customerName: '', customerMobile: '', customerId: '', 
        brand: '', device: '', serialNumber: '', 
        serviceType: 'Carry In', problemReported: '', productCondition: '', 
        lockCredential: '', assignedTechnician: '', technicianComment: '',
        estimatedCost: '', status: 'Pending', dueDate: ''
    });
    const [customers, setCustomers] = useState([]);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', mobile: '' });
    const [usePattern, setUsePattern] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            const data = await getCustomers();
            setCustomers(data);
        };
        fetchCustomers();
    }, []);

    const getCustomerFullName = (c) => {
        if (!c) return '';
        if (c.name) return c.name;
        return '';
    };

    const handleQuickAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.mobile) {
            return alert("Name and Mobile are required");
        }
        try {
            const created = await addCustomer(newCustomer);
            const data = await getCustomers();
            setCustomers(data);
            setForm({
                ...form,
                customerMobile: created.mobile,
                customerId: created._id,
                customerName: getCustomerFullName(created)
            });
            setShowAddCustomer(false);
            setNewCustomer({ name: '', mobile: '' });
        } catch (error) {
            console.error(error);
            alert("Failed to add customer");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...form, 
                issue: form.problemReported, // map to backend
                estimatedCost: parseFloat(form.estimatedCost) || 0,
                cost: parseFloat(form.estimatedCost) || 0, // initially same
            };
            await createRepair(payload);
            onRepairAdded();
        } catch (error) {
            console.error('createRepair error', error);
            alert('Failed to create repair ticket.');
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '4px 0 15px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
    const labelStyle = { fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>🔧 Create Repair Ticket</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Column 1 */}
                    <div>
                        <label style={labelStyle}>Customer Mobile</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <select required={!showAddCustomer} style={{...inputStyle, flex: 1}} value={form.customerMobile} onChange={e => {
                                const selectedMobile = e.target.value;
                                const selectedCustomer = customers.find(c => c.mobile === selectedMobile);
                                setForm({
                                    ...form, customerMobile: selectedMobile,
                                    customerId: selectedCustomer ? selectedCustomer._id : '',
                                    customerName: selectedCustomer ? getCustomerFullName(selectedCustomer) : ''
                                });
                            }}>
                                <option value="">Select mobile number</option>
                                {customers.map(c => (
                                    <option key={c._id} value={c.mobile}>{c.mobile} - {getCustomerFullName(c)}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => setShowAddCustomer(!showAddCustomer)} style={{ padding: '0 15px', marginTop: '4px', height: '42px', backgroundColor: showAddCustomer ? '#f44336' : '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>
                                {showAddCustomer ? '×' : '+'}
                            </button>
                        </div>

                        {showAddCustomer && (
                            <div style={{ backgroundColor: '#f1f8e9', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #c5e1a5' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#33691e' }}>Quick Add Customer</h4>
                                <input style={{...inputStyle, margin: '0 0 10px 0'}} placeholder="Full Name *" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                                <input style={{...inputStyle, margin: '0 0 10px 0'}} placeholder="Mobile *" value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} />
                                <button type="button" onClick={handleQuickAddCustomer} style={{ width: '100%', padding: '10px', backgroundColor: '#33691e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save & Select</button>
                            </div>
                        )}

                        <label style={labelStyle}>Customer Name</label>
                        <input required style={{...inputStyle, backgroundColor: '#f9f9f9'}} placeholder="Auto-filled" value={form.customerName} readOnly />

                        <label style={labelStyle}>Service Type</label>
                        <select required style={inputStyle} value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})}>
                            <option value="Carry In">Carry In</option>
                            <option value="Pick Up">Pick Up</option>
                            <option value="On Site">On Site</option>
                        </select>

                        <label style={labelStyle}>Brand</label>
                        <input required style={inputStyle} placeholder="e.g., Apple, Samsung" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />

                        <label style={labelStyle}>Device / Model</label>
                        <input required style={inputStyle} placeholder="e.g., iPhone 13 Pro" value={form.device} onChange={e => setForm({...form, device: e.target.value})} />

                        <label style={labelStyle}>Serial Number / IMEI</label>
                        <input required style={inputStyle} placeholder="Serial No." value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} />
                    </div>

                    {/* Column 2 */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Lock Credentials</label>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setUsePattern(!usePattern);
                                    setForm({...form, lockCredential: ''}); // Reset when switching
                                }}
                                style={{ fontSize: '12px', background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {usePattern ? 'Use Text Passcode' : 'Draw Pattern'}
                            </button>
                        </div>
                        
                        {usePattern ? (
                            <div style={{ padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '15px' }}>
                                <PatternLock 
                                    onChange={(patternArr) => {
                                        setForm({...form, lockCredential: patternArr.length > 0 ? `PATTERN:${patternArr.join('-')}` : ''});
                                    }} 
                                />
                                <input type="hidden" required value={form.lockCredential} />
                                {form.lockCredential === '' && <div style={{color:'red', fontSize:12, textAlign:'center'}}>Please draw a pattern</div>}
                            </div>
                        ) : (
                            <input style={inputStyle} placeholder="e.g., 1234" value={form.lockCredential} onChange={e => setForm({...form, lockCredential: e.target.value})} />
                        )}

                        <label style={labelStyle}>Product Condition</label>
                        <input required style={inputStyle} placeholder="e.g., Scratched screen, dead battery" value={form.productCondition} onChange={e => setForm({...form, productCondition: e.target.value})} />

                        <label style={labelStyle}>Assigned Technician</label>
                        <input required style={inputStyle} placeholder="Technician Name" value={form.assignedTechnician} onChange={e => setForm({...form, assignedTechnician: e.target.value})} />

                        <label style={labelStyle}>Due Date</label>
                        <input required type="date" style={inputStyle} value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />

                        <label style={labelStyle}>Estimated Cost (Rs.)</label>
                        <input required type="number" style={inputStyle} placeholder="0.00" value={form.estimatedCost} onChange={e => setForm({...form, estimatedCost: e.target.value})} />
                    </div>

                </div>

                <label style={labelStyle}>Problem Reported</label>
                <textarea required style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="Detailed description of the issue..." value={form.problemReported} onChange={e => setForm({...form, problemReported: e.target.value})} />

                <label style={labelStyle}>Technician Comments (Optional)</label>
                <textarea style={{ ...inputStyle, height: '60px', resize: 'none' }} placeholder="Any notes for the tech..." value={form.technicianComment} onChange={e => setForm({...form, technicianComment: e.target.value})} />


                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button type="button" onClick={onCancel} style={{ flex: 1, padding: '14px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '16px' }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, padding: '14px', border: 'none', backgroundColor: '#ff9800', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Create Ticket</button>
                </div>
            </form>
        </div>
    );
};

export default AddRepairDesktop;