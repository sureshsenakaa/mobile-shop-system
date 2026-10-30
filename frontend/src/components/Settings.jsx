import React, { useState, useEffect, useContext } from 'react';
import { apiUrl, API_BASE_URL, resolveMediaUrl } from '../api/config';
import { generate2FA, enable2FA } from '../api/authApi';
import { AuthContext } from '../contexts/AuthContext';

const Settings = ({ user }) => {
    const { updateAuthUser } = useContext(AuthContext) || {};

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Shop Profile & Branding State (Only for Shop Admins)
    const [shopName, setShopName] = useState(user?.shopName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [themeColor, setThemeColor] = useState(user?.themeColor || '#3b82f6');
    const [printLogo, setPrintLogo] = useState(user?.printLogo || false);
    const [currentLogoUrl, setCurrentLogoUrl] = useState(user?.logoUrl || null);
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);

    // 2FA State
    const [qrCode, setQrCode] = useState(null);
    const [twoFaSecret, setTwoFaSecret] = useState(null);
    const [twoFaPin, setTwoFaPin] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);

    useEffect(() => {
        if (user && user.role === 'shop_admin') {
            fetch(apiUrl('/settings/branding'), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    if (data.name) setShopName(data.name);
                    if (data.phone) setPhone(data.phone);
                    if (data.address) setAddress(data.address);
                    if (data.themeColor) setThemeColor(data.themeColor);
                    if (data.printLogo !== undefined) setPrintLogo(data.printLogo);
                    if (data.logoUrl) setCurrentLogoUrl(data.logoUrl);
                }
            })
            .catch(err => console.warn('Could not load shop branding', err));
        }
    }, [user]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return alert("New passwords don't match!");
        }
        try {
            const res = await fetch(apiUrl('/auth/change-password'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error changing password');
            
            alert('Password changed successfully! You will be logged out.');
            localStorage.clear();
            window.location.href = '/login';
        } catch (err) {
            alert(err.message);
        }
    };

    const handleBrandingUpdate = async (e) => {
        e.preventDefault();
        setSavingBranding(true);
        try {
            const formData = new FormData();
            formData.append('name', shopName);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('themeColor', themeColor);
            formData.append('printLogo', printLogo);
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await fetch(apiUrl('/settings/branding'), {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error updating branding');
            
            if (data.shop) {
                if (data.shop.logoUrl) setCurrentLogoUrl(data.shop.logoUrl);
                setLogoFile(null);
                setPreviewUrl(null);
                if (updateAuthUser) {
                    updateAuthUser({
                        shopName: data.shop.name,
                        phone: data.shop.phone,
                        address: data.shop.address,
                        themeColor: data.shop.themeColor,
                        logoUrl: data.shop.logoUrl,
                        printLogo: data.shop.printLogo
                    });
                }
            }

            alert('Shop profile and invoice branding updated successfully!');
        } catch (err) {
            alert(err.message);
        } finally {
            setSavingBranding(false);
        }
    };

    const handleGenerate2FA = async () => {
        try {
            const res = await generate2FA();
            if (res.error) throw new Error(res.error);
            setQrCode(res.qrCodeUrl);
            setTwoFaSecret(res.secret);
        } catch (err) {
            alert(err.message || 'Error generating 2FA');
        }
    };

    const handleEnable2FA = async (e) => {
        e.preventDefault();
        try {
            const res = await enable2FA(twoFaPin);
            if (res.error) throw new Error(res.error);
            alert('Two-Factor Authentication enabled successfully!');
            setIs2FAEnabled(true);
            setQrCode(null);
            setTwoFaSecret(null);
        } catch (err) {
            alert(err.message || 'Invalid PIN. Try again.');
        }
    };

    const resolvedLogoSrc = previewUrl || (currentLogoUrl ? resolveMediaUrl(currentLogoUrl) : null);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Settings</h2>

            {user && user.role === 'shop_admin' && (
                <div className="card" style={{ marginBottom: 30 }}>
                    <h3 style={{ marginBottom: 10 }}>Shop Details & Invoice Branding</h3>
                    <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                        Configure your shop name, contact details, and invoice/receipt logo. These will appear on all bills and invoices.
                    </p>
                    <form onSubmit={handleBrandingUpdate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 15, marginBottom: 15 }}>
                            <div>
                                <label className="form-label">Shop Name (Displayed on Bills & Invoices)</label>
                                <input 
                                    type="text" 
                                    value={shopName} 
                                    onChange={e => setShopName(e.target.value)} 
                                    required 
                                    className="input" 
                                    placeholder="e.g. My Phone Shop" 
                                />
                            </div>
                            <div>
                                <label className="form-label">Contact Phone Number</label>
                                <input 
                                    type="text" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    className="input" 
                                    placeholder="e.g. 077 123 4567" 
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 15 }}>
                            <label className="form-label">Shop Address</label>
                            <input 
                                type="text" 
                                value={address} 
                                onChange={e => setAddress(e.target.value)} 
                                className="input" 
                                placeholder="e.g. 123 Main Street, Colombo" 
                            />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label className="form-label">Theme Color</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input 
                                    type="color" 
                                    value={themeColor} 
                                    onChange={e => setThemeColor(e.target.value)} 
                                    style={{ padding: 4, height: 40, width: 60, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }} 
                                />
                                <span style={{ fontSize: 13, color: '#666' }}>{themeColor}</span>
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: 20, padding: 20, background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Shop Logo for Invoices & Receipts</h4>
                            
                            {resolvedLogoSrc && (
                                <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 15 }}>
                                    <div style={{ background: '#fff', padding: 8, border: '1px solid #ddd', borderRadius: 8, display: 'inline-block' }}>
                                        <img 
                                            src={resolvedLogoSrc} 
                                            alt="Shop Logo" 
                                            style={{ maxHeight: 70, maxWidth: 140, objectFit: 'contain', display: 'block' }} 
                                            onError={(e) => {
                                                const rel = currentLogoUrl?.startsWith('/') ? currentLogoUrl : `/${currentLogoUrl}`;
                                                if (rel && e.target.src !== window.location.origin + rel) {
                                                    e.target.src = rel;
                                                }
                                            }}
                                        />
                                    </div>
                                    <div style={{ fontSize: 13, color: '#555' }}>
                                        {previewUrl ? 'New Logo Selected (Click Save to apply)' : 'Current Shop Logo'}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: 15 }}>
                                <label className="form-label">{resolvedLogoSrc ? 'Change Shop Logo (PNG, JPG)' : 'Upload Shop Logo (PNG, JPG)'}</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={e => {
                                        const file = e.target.files[0] || null;
                                        setLogoFile(file);
                                        if (file) {
                                            setPreviewUrl(URL.createObjectURL(file));
                                        } else {
                                            setPreviewUrl(null);
                                        }
                                    }} 
                                    className="input" 
                                    style={{ padding: '8px' }} 
                                />
                                <p className="small-muted" style={{ margin: '4px 0 0 0' }}>
                                    Your logo will be rendered crisply at the top of all PDF invoices.
                                </p>
                            </div>

                            <div style={{ marginTop: 15 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={printLogo} 
                                        onChange={e => setPrintLogo(e.target.checked)} 
                                        style={{ width: 18, height: 18 }} 
                                    />
                                    <span>Print Logo on Thermal Receipts as well</span>
                                </label>
                                <p className="small-muted" style={{ margin: '5px 0 0 28px' }}>
                                    Uncheck if you use a 58mm POS thermal printer that has trouble printing images clearly. (PDF invoices will always include the logo).
                                </p>
                            </div>
                        </div>

                        <button type="submit" disabled={savingBranding} className="btn btn-primary">
                            {savingBranding ? 'Saving...' : 'Save Shop Settings & Branding'}
                        </button>
                    </form>
                </div>
            )}

            <div className="card" style={{ marginBottom: 30 }}>
                <h3 style={{ marginBottom: 20 }}>Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                    <div style={{ marginBottom: 15 }}>
                        <label className="form-label">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="input" />
                    </div>
                    <div style={{ marginBottom: 15 }}>
                        <label className="form-label">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="input" />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="input" />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                </form>
            </div>

            <div className="card" style={{ marginBottom: 30 }}>
                <h3 style={{ marginBottom: 10 }}>Two-Factor Authentication (2FA)</h3>
                <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                    Secure your account with a Google Authenticator or Authy PIN.
                </p>
                {is2FAEnabled ? (
                    <div style={{ padding: '15px', background: '#dcfce7', color: '#166534', borderRadius: '8px', border: '1px solid #bbf7d0', fontWeight: 'bold' }}>
                        ✅ 2FA is currently ENABLED on your account.
                    </div>
                ) : (
                    <div>
                        {!qrCode ? (
                            <button onClick={handleGenerate2FA} className="btn btn-primary" style={{ background: '#2563eb' }}>
                                Setup Two-Factor Auth
                            </button>
                        ) : (
                            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4>1. Scan this QR Code with your Authenticator App</h4>
                                <img src={qrCode} alt="2FA QR Code" style={{ border: '4px solid white', borderRadius: '8px', margin: '15px 0' }} />
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Secret Key: {twoFaSecret}</p>
                                
                                <h4>2. Enter the 6-digit PIN from the app</h4>
                                <form onSubmit={handleEnable2FA} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <input type="text" value={twoFaPin} onChange={e => setTwoFaPin(e.target.value)} required maxLength="6" placeholder="000000" className="input" style={{ width: '150px', textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }} />
                                    <button type="submit" className="btn btn-primary">Verify & Enable</button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {user && user.role !== 'super_admin' && (
                <div className="card" style={{ marginTop: 30 }}>
                    <h3 style={{ marginBottom: 10 }}>Local Barcode Printer</h3>
                    <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                        Configure the barcode sticker dimensions and header for THIS computer only. Defaults to 38x25mm.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginBottom: 15 }}>
                        <div>
                            <label className="form-label">Sticker Width (mm)</label>
                            <input type="number" defaultValue={localStorage.getItem('stickerWidth') || '38'} id="localStickerWidth" className="input" style={{ width: 120 }} />
                        </div>
                        <div>
                            <label className="form-label">Sticker Height (mm)</label>
                            <input type="number" defaultValue={localStorage.getItem('stickerHeight') || '25'} id="localStickerHeight" className="input" style={{ width: 120 }} />
                        </div>
                        <div style={{ minWidth: 200, flex: 1 }}>
                            <label className="form-label">Shop Name on Barcode</label>
                            <input type="text" defaultValue={localStorage.getItem('barcodeShopName') !== null ? localStorage.getItem('barcodeShopName') : (shopName || user?.shopName || '')} id="localBarcodeShopName" className="input" placeholder="Shop Name" />
                        </div>
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" defaultChecked={localStorage.getItem('barcodeIncludeShopName') !== 'false'} id="localBarcodeIncludeShopName" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                            <span>Print Shop Name header on barcode stickers</span>
                        </label>
                    </div>
                    <button onClick={() => {
                        localStorage.setItem('stickerWidth', document.getElementById('localStickerWidth').value || '38');
                        localStorage.setItem('stickerHeight', document.getElementById('localStickerHeight').value || '25');
                        localStorage.setItem('barcodeShopName', document.getElementById('localBarcodeShopName').value);
                        localStorage.setItem('barcodeIncludeShopName', document.getElementById('localBarcodeIncludeShopName').checked ? 'true' : 'false');
                        alert('Local barcode printer settings saved successfully!');
                    }} className="btn btn-primary">Save Local Settings</button>
                </div>
            )}
        </div>
    );
};

export default Settings;
