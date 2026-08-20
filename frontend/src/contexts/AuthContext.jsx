import React, { createContext, useState, useEffect } from 'react';
import { logout as authApiLogout } from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setAuthUser(user);
                if (user.themeColor) {
                    document.documentElement.style.setProperty('--primary', user.themeColor);
                }
            }
        } catch (err) {
            console.error("Error loading auth state", err);
        } finally {
            setLoading(false);
        }

        // Inactivity Timeout (30 minutes)
        let timeout;
        const resetTimeout = () => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                const token = localStorage.getItem('token');
                if (token) {
                    alert('Session expired due to inactivity. Please log in again.');
                    logout();
                }
            }, 30 * 60 * 1000); // 30 minutes
        };

        window.addEventListener('mousemove', resetTimeout);
        window.addEventListener('keydown', resetTimeout);
        resetTimeout();

        return () => {
            if (timeout) clearTimeout(timeout);
            window.removeEventListener('mousemove', resetTimeout);
            window.removeEventListener('keydown', resetTimeout);
        };
    }, []);

    const login = (user) => {
        setAuthUser(user);
        if (user.themeColor) {
            document.documentElement.style.setProperty('--primary', user.themeColor);
        }
    };

    const logout = () => {
        authApiLogout();
        setAuthUser(null);
        document.documentElement.style.removeProperty('--primary');
    };

    return (
        <AuthContext.Provider value={{ authUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
