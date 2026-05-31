import React, { useState } from 'react';
import { login } from '../api/authApi';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const resetFeedback = () => { setMessage(null); setError(null); };

    const handleLogin = async (e) => {
        e.preventDefault();
        resetFeedback();
        if (!username || !password) { setError('Username and password required'); return; }
        setLoading(true);
        try {
            const res = await login({ username, password });
            setMessage('Signed in');
            if (onLogin) onLogin(res);
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: 420, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 6 }}>
            <h2 style={{ marginTop: 0 }}>Sign in</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 13 }}>Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 13 }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
                </div>

                {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
                {message && <div style={{ color: '#0b8043', marginBottom: 8 }}>{message}</div>}

                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing...' : 'Sign In'}</button>
                </div>

                <div style={{ marginTop: 12, fontSize: 13, color: '#666' }}>
                    By continuing you agree to your shop's policies.
                </div>
            </form>
        </div>
    );
};

export default Login;
