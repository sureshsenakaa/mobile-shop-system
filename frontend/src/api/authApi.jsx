import { apiUrl } from './config';
import { parseJsonResponse } from './_utils';

export const login = async ({ username, password }) => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch (e) { }
    const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await parseJsonResponse(response);
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const register = async ({ username, password, role }) => {
    return { message: 'Use Admin Panel' };
};

export const verify2FA = async (tempToken, pin) => {
    const response = await fetch(apiUrl('/auth/verify-2fa'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, pin })
    });
    const data = await parseJsonResponse(response);
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const resetTempPassword = async (tempToken, newPassword) => {
    const response = await fetch(apiUrl('/auth/reset-temp-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, newPassword })
    });
    const data = await parseJsonResponse(response);
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
};

export const generate2FA = async () => {
    const response = await fetch(apiUrl('/auth/generate-2fa'), {
        method: 'POST',
        headers: getAuthHeader()
    });
    return parseJsonResponse(response);
};

export const enable2FA = async (pin) => {
    const response = await fetch(apiUrl('/auth/enable-2fa'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ pin })
    });
    return parseJsonResponse(response);
};

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
};

export const isTokenValid = () => {
    return !!localStorage.getItem('token');
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
