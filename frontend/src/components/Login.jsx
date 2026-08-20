import React, { useState } from 'react';
import { login, resetTempPassword, verify2FA } from '../api/authApi';
import './Login.css';

const Login = ({ onLogin }) => {
    const [step, setStep] = useState('login'); // 'login' | 'reset_password' | '2fa'
    const [tempToken, setTempToken] = useState(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pin, setPin] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        if (!username || !password) { setError('Username and password required'); return; }
        setLoading(true);
        try {
            const res = await login({ username, password });
            if (res.mustChangePassword) {
                setTempToken(res.tempToken);
                setStep('reset_password');
            } else if (res.require2FA) {
                setTempToken(res.tempToken);
                setStep('2fa');
            } else if (onLogin && res.user) {
                onLogin(res.user);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const res = await resetTempPassword(tempToken, newPassword);
            if (onLogin && res.user) onLogin(res.user);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        setError(null);
        if (!pin) { setError('Please enter the 6-digit PIN'); return; }
        setLoading(true);
        try {
            const res = await verify2FA(tempToken, pin);
            if (onLogin && res.user) onLogin(res.user);
        } catch (err) {
            setError(err.message || 'Invalid 2FA PIN.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">MOBILE ZONE</h1>
                    <p className="login-subtitle">
                        {step === 'login' ? 'System Manager Login' : step === 'reset_password' ? 'Set New Password' : 'Two-Factor Authentication'}
                    </p>
                </div>

                {step === 'login' && (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <div className="input-icon-wrapper">
                                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <input className="input-field with-icon" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-icon-wrapper">
                                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input type="password" className="input-field with-icon" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" disabled={loading} className="login-btn">{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</button>
                    </form>
                )}

                {step === 'reset_password' && (
                    <form onSubmit={handleResetPassword} className="login-form">
                        <div className="input-group">
                            <label className="input-label">New Password</label>
                            <input type="password" className="input-field" placeholder="Enter new strong password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" disabled={loading} className="login-btn">{loading ? 'Saving...' : 'Set Password & Login'}</button>
                    </form>
                )}

                {step === '2fa' && (
                    <form onSubmit={handle2FA} className="login-form">
                        <div className="input-group">
                            <label className="input-label">Authenticator PIN</label>
                            <input type="text" className="input-field" placeholder="000000" value={pin} onChange={e => setPin(e.target.value)} required maxLength="6" style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }} />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" disabled={loading} className="login-btn">{loading ? 'Verifying...' : 'Verify PIN'}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
