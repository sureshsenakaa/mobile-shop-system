import React, { useState } from 'react';
import { apiUrl } from '../api/config';
import { generate2FA, enable2FA } from '../api/authApi';

const Settings = ({ user }) => {
    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Shop Branding State (Only for Shop Admins)
    const [themeColor, setThemeColor] = useState('#3b82f6');
    const [printLogo, setPrintLogo] = useState(false);
    const [logoFile, setLogoFile] = useState(null);

    // 2FA State
    const [qrCode, setQrCode] = useState(null);
    const [twoFaSecret, setTwoFaSecret] = useState(null);
    const [twoFaPin, setTwoFaPin] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(user.twoFactorEnabled || false);

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
        try {
            const formData = new FormData();
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
            
            alert('Shop branding updated successfully! Please refresh to see changes.');
        } catch (err) {
            alert(err.message);
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

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>Settings</h2>

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

            {user && user.role === 'shop_admin' && (
                <div className="card">
                    <h3 style={{ marginBottom: 10 }}>Shop Branding</h3>
                    <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                        Configure how your shop appears and customize your thermal receipts.
                    </p>
                    <form onSubmit={handleBrandingUpdate}>
                        <div style={{ marginBottom: 20 }}>
                            <label className="form-label">Theme Color</label>
                            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ padding: 4, height: 40, width: 60, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                        </div>
                        
                        <div style={{ marginBottom: 20, padding: 20, background: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
                            <h4 style={{ margin: '0 0 10px 0' }}>Receipt Printer Settings</h4>
                            <div style={{ marginBottom: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600 }}>
                                    <input type="checkbox" checked={printLogo} onChange={e => setPrintLogo(e.target.checked)} style={{ width: 18, height: 18 }} />
                                    <span>Print Logo on Receipts</span>
                                </label>
                                <p className="small-muted" style={{ margin: '5px 0 0 28px' }}>
                                    If disabled, receipts will be "Text Only" (Recommended for blurry printers).
                                </p>
                            </div>
                            
                            {printLogo && (
                                <div style={{ marginTop: 20 }}>
                                    <label className="form-label">Upload Logo (Auto-converted to B&W)</label>
                                    <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="input" style={{ padding: '8px' }} />
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary">Save Branding</button>
                    </form>
                </div>
            )}
            
            {user && user.role !== 'super_admin' && (
                <div className="card" style={{ marginTop: 30 }}>
                    <h3 style={{ marginBottom: 10 }}>Local Barcode Printer</h3>
                    <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                        Configure the barcode sticker dimensions for THIS computer only. Defaults to 38x25mm.
                    </p>
                    <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
                        <div>
                            <label className="form-label">Sticker Width (mm)</label>
                            <input type="number" defaultValue={localStorage.getItem('stickerWidth') || '38'} id="localStickerWidth" className="input" style={{ width: 120 }} />
                        </div>
                        <div>
                            <label className="form-label">Sticker Height (mm)</label>
                            <input type="number" defaultValue={localStorage.getItem('stickerHeight') || '25'} id="localStickerHeight" className="input" style={{ width: 120 }} />
                        </div>
                    </div>
                    <button onClick={() => {
                        localStorage.setItem('stickerWidth', document.getElementById('localStickerWidth').value || '38');
                        localStorage.setItem('stickerHeight', document.getElementById('localStickerHeight').value || '25');
                        alert('Local printer settings saved! Barcodes will now print at this size on this computer.');
                    }} className="btn btn-primary">Save Local Settings</button>
                </div>
            )}
        </div>
    );
};

export default Settings;
