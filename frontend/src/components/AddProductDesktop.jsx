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

        const selectedSupplier = suppliers.find(s => s._id === form.supplier);
        const imeiList = form.imeiText ? form.imeiText.split(/[\s,]+/).map(i => i.trim()).filter(i => i) : [];
        
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
            imeiList: imeiList,
            // ensure numeric fields are numbers
            price: Number(form.price || 0),
            cost: Number(form.cost || 0),
            stock: Number(form.stock || 0)
        };

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
        }
    };

    const inputStyle = { width: '100%', padding: '10px', margin: '8px 0 20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
    const selectStyle = { ...inputStyle, cursor: 'pointer' };

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
                            style={{...inputStyle, minHeight: '80px', fontFamily: 'monospace'}} 
                            placeholder="Enter or scan IMEIs here..." 
                            value={form.imeiText} 
                            onChange={e=>setForm({...form, imeiText:e.target.value})}
                        />

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

                <label>Stock {productType === 'Phone' && form.imeiText ? '(Auto-calculated)' : ''}</label>
                <input 
                    type="number" 
                    style={inputStyle} 
                    required 
                    readOnly={productType === 'Phone' && form.imeiText.trim().length > 0}
                    value={productType === 'Phone' && form.imeiText.trim().length > 0 ? form.imeiText.split(/[\s,]+/).map(i => i.trim()).filter(i => i).length : form.stock} 
                    onChange={e=>setForm({...form, stock:e.target.value})}
                />

                <div style={{display:'flex', gap:'10px'}}>
                    <button type="button" onClick={onCancel} style={{flex:1}}>Cancel</button>
                    <button type="submit" style={{flex:1}}>Save</button>
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
