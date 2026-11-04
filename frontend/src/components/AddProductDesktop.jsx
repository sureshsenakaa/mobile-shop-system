import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../api/supplierApi';
import { addProduct } from '../api/productApi';
import BarcodePrinter from './BarcodePrinter';
import { PHONE_BRANDS, PHONE_MODELS } from '../utils/phoneCatalog';

const AddProductDesktop = ({ onProductAdded, onCancel }) => {
    const [productType, setProductType] = useState('Phone'); // default is Phone
    const [form, setForm] = useState({ brand: '', model: '', ram: '', storage: '', color: '', price: '', cost: '', stock: '', supplier: '', imeiText: '', accessoryType: '' });
    const [suppliers, setSuppliers] = useState([]);
    const [printTarget, setPrintTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    };

    const generateBarcode = () => Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            alert('Cannot save product: You are currently offline. Please check your internet connection.');
            return;
        }

        const imeiList = form.imeiText ? form.imeiText.split(/[\s,]+/).map(i => i.trim()).filter(i => i) : [];
        const duplicateImeis = imeiList.filter((item, index) => imeiList.indexOf(item) !== index);

        if (productType === 'Phone') {
            if (imeiList.length === 0) {
                alert('Please enter or scan at least one IMEI. For phones, stock is determined by the number of IMEIs.');
                return;
            }
            if (duplicateImeis.length > 0) {
                alert(`Duplicate IMEI detected: ${[...new Set(duplicateImeis)].join(', ')}. Each phone must have a unique IMEI.`);
                return;
            }
        }

        const selectedSupplier = suppliers.find(s => s._id === form.supplier);
        
        const newProduct = { 
            brand: form.brand,
            model: form.model,
            ram: form.ram,
            storage: form.storage,
            color: form.color,
            type: productType,
            accessoryType: productType === 'Accessories' ? form.accessoryType : undefined,
            barcode: generateBarcode(),
            supplier: form.supplier || undefined,
            supplierName: selectedSupplier ? selectedSupplier.name : '',
            imei: imeiList.length > 0 ? imeiList[0] : (form.imei || undefined),
            imeiList: imeiList,
            // ensure numeric fields are numbers
            price: Number(form.price || 0),
            cost: Number(form.cost || 0),
            stock: productType === 'Phone' ? imeiList.length : Number(form.stock || 0)
        };

        setIsSubmitting(true);
        try {
            const created = await addProduct(newProduct);
            // The API returns the created product on success
            if (created && created._id) {
                if (window.confirm(`Product saved! Do you want to print ${newProduct.stock > 0 ? newProduct.stock : 1} barcode stickers now?`)) {
                    setPrintTarget(created);
                } else {
                    onProductAdded(); // Refresh list
                }
            } else {
                // Show server-provided message if available
                const msg = created && created.message ? created.message : (created && created.error ? created.error : 'Error saving product');
                alert(msg);
            }
        } catch (err) {
            console.error('Add product error:', err);
            const msg = err && err.message ? err.message : 'Server error';
            if (typeof msg === 'string' && msg.toLowerCase().includes('invalid or expired token')) {
                alert('Session expired — please sign in again.');
                try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) { /* ignore */ }
                // reload so App shows the login screen
                window.location.reload();
                return;
            }
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '8px 0 20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
    const selectStyle = { ...inputStyle, cursor: 'pointer' };

    const imeiList = form.imeiText ? form.imeiText.split(/[\s,]+/).map(i => i.trim()).filter(i => i) : [];
    const duplicateImeis = imeiList.filter((item, index) => imeiList.indexOf(item) !== index);
    const imeiCount = imeiList.length;

    return (
        <div style={{ maxWidth:'500px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'12px' }}>
            <h2 style={{textAlign:'center'}}>Add Product</h2>
            <label>Product Type</label>
            <select style={selectStyle} value={productType} onChange={e=>setProductType(e.target.value)}>
                <option value="Phone">Phone</option>
                <option value="Accessories">Accessories</option>
            </select>
            <form onSubmit={handleSubmit}>
                {productType === 'Phone' ? (
                    <>
                        <label>Brand</label>
                        <select style={selectStyle} value={form.brand} required onChange={e=>setForm({...form, brand:e.target.value, model: ''})}>
                            <option key="none" value="">--Select Brand--</option>
                            {PHONE_BRANDS.map((b,i)=>(<option key={`brand-${i}`} value={b}>{b}</option>))}
                            <option key="brand-other" value="Other">Other</option>
                        </select>

                        <label>Model</label>
                        <input 
                            list="model-options"
                            style={inputStyle} 
                            placeholder="Select or Type Model Name" 
                            required 
                            value={form.model} 
                            onChange={e=>setForm({...form, model:e.target.value})}
                        />
                        {form.brand && PHONE_MODELS[form.brand] && (
                            <datalist id="model-options">
                                {PHONE_MODELS[form.brand].map((m, i) => <option key={i} value={m} />)}
                            </datalist>
                        )}

                        <label>RAM</label>
                        <select style={selectStyle} required value={form.ram} onChange={e=>setForm({...form, ram:e.target.value})}>
                            <option key="none-ram" value="">--Select RAM--</option>
                            <option key="ram-2" value="2GB">2GB</option>
                            <option key="ram-3" value="3GB">3GB</option>
                            <option key="ram-4" value="4GB">4GB</option>
                            <option key="ram-6" value="6GB">6GB</option>
                            <option key="ram-8" value="8GB">8GB</option>
                            <option key="ram-12" value="12GB">12GB</option>
                            <option key="ram-16" value="16GB">16GB</option>
                            <option key="ram-other" value="Other">Other</option>
                        </select>

                        <label>Storage</label>
                        <select style={selectStyle} required value={form.storage} onChange={e=>setForm({...form, storage:e.target.value})}>
                            <option key="none-storage" value="">--Select Storage--</option>
                            <option key="st-16" value="16GB">16GB</option>
                            <option key="st-32" value="32GB">32GB</option>
                            <option key="st-64" value="64GB">64GB</option>
                            <option key="st-128" value="128GB">128GB</option>
                            <option key="st-256" value="256GB">256GB</option>
                            <option key="st-512" value="512GB">512GB</option>
                            <option key="st-1tb" value="1TB">1TB</option>
                            <option key="st-other" value="Other">Other</option>
                        </select>

                        <label>IMEIs (Comma or newline separated)</label>
                        <textarea 
                            style={{...inputStyle, minHeight: '80px', fontFamily: 'monospace', marginBottom: '8px'}} 
                            placeholder="Enter or scan IMEIs here..." 
                            value={form.imeiText} 
                            onChange={e=>setForm({...form, imeiText:e.target.value})}
                        />
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                            <span style={{ 
                                color: imeiCount === 0 ? '#64748b' : '#047857', 
                                fontWeight: '600',
                                background: imeiCount === 0 ? '#f1f5f9' : '#ecfdf5',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${imeiCount === 0 ? '#cbd5e1' : '#a7f3d0'}`
                            }}>
                                {imeiCount === 0 ? '📱 0 IMEIs entered' : `📱 ${imeiCount} IMEI${imeiCount > 1 ? 's' : ''} entered (Stock will be ${imeiCount})`}
                            </span>
                            {duplicateImeis.length > 0 && (
                                <span style={{ color: '#b91c1c', fontWeight: 'bold', background: '#fef2f2', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                    ⚠️ Duplicate: {[...new Set(duplicateImeis)].join(', ')}
                                </span>
                            )}
                        </div>

                    </>
                ) : (
                    <>
                        <label>Name</label>
                        <input style={inputStyle} placeholder="Accessory Name" required value={form.model} onChange={e=>setForm({...form, model:e.target.value})}/>

                        <label>Brand (Optional)</label>
                        <input style={inputStyle} placeholder="Brand or Manufacturer" value={form.brand} onChange={e=>setForm({...form, brand:e.target.value})}/>

                        <label>Accessory Type</label>
                        <select style={selectStyle} value={form.accessoryType} onChange={e=>setForm({...form, accessoryType: e.target.value})} required>
                            <option key="acc-none" value="">-- Select type --</option>
                            {['tempered','backcover','charger','cable','earphone','speaker','powerbank','Others'].map((t,i)=>(<option key={`acc-${i}`} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
                        </select>
                    </>
                )}

                <label>Supplier</label>
                <select style={selectStyle} value={form.supplier} onChange={e=>setForm({...form, supplier:e.target.value})}>
                    <option value="">--Select Supplier (Optional)--</option>
                    {suppliers.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
                </select>

                <label>Color</label>
                <input style={inputStyle} placeholder="Optional" value={form.color} onChange={e=>setForm({...form, color:e.target.value})}/>

                <label>Cost (Rs.)</label>
                <input type="number" style={inputStyle} value={form.cost} onChange={e=>setForm({...form, cost:e.target.value})} />

                <label>Price (Rs.)</label>
                <input type="number" style={inputStyle} required value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>

                {productType === 'Phone' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ margin: 0, fontWeight: '500' }}>Stock</label>
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                🔒 Locked to IMEI count
                            </span>
                        </div>
                        <input 
                            type="number" 
                            style={{ 
                                ...inputStyle, 
                                margin: '6px 0 8px',
                                backgroundColor: '#f8fafc', 
                                cursor: 'not-allowed', 
                                color: '#1e293b', 
                                fontWeight: 'bold',
                                border: '1px solid #cbd5e1'
                            }} 
                            required 
                            readOnly
                            value={imeiCount}
                        />
                        <div style={{
                            margin: '0 0 20px',
                            padding: '10px 12px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#1e40af',
                            lineHeight: '1.4'
                        }}>
                            💡 <strong>Phone Stock is determined by IMEIs:</strong> You have entered <strong>{imeiCount}</strong> IMEI(s), so stock is fixed at <strong>{imeiCount}</strong>. You cannot manually type a different stock because every phone requires its own unique IMEI. To add more stock, enter or scan the remaining IMEIs in the box above.
                        </div>
                    </div>
                ) : (
                    <div>
                        <label>Stock</label>
                        <input 
                            type="number" 
                            min="0"
                            style={inputStyle} 
                            required 
                            value={form.stock} 
                            onChange={e=>setForm({...form, stock:e.target.value})}
                            placeholder="Enter stock quantity"
                        />
                    </div>
                )}

                <div style={{display:'flex', gap:'10px'}}>
                    <button type="button" onClick={onCancel} style={{flex:1}} disabled={isSubmitting}>Cancel</button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            fontWeight: 'bold',
                            cursor: isSubmitting ? 'wait' : 'pointer',
                            opacity: isSubmitting ? 0.75 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-sm" style={{ borderTopColor: '#ffffff' }}></span>
                                <span>Saving Product...</span>
                            </>
                        ) : (
                            'Save'
                        )}
                    </button>
                </div>
            </form>

            {printTarget && (
                <BarcodePrinter 
                    product={printTarget} 
                    onClose={() => {
                        setPrintTarget(null);
                        onProductAdded(); // Refresh list after printing is done
                    }} 
                />
            )}
        </div>
    );
};

export default AddProductDesktop;
