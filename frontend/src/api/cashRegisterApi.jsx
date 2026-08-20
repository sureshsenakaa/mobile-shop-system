import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const getTodayRegister = async () => {
    const response = await fetch(apiUrl('/cash-register/today'), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const openRegister = async (openingBalance) => {
    const response = await fetch(apiUrl('/cash-register/open'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ openingBalance })
    });
    return parseJsonResponse(response);
};

export const closeRegister = async (closingBalance, notes) => {
    const response = await fetch(apiUrl('/cash-register/close'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ closingBalance, notes })
    });
    return parseJsonResponse(response);
};

export const getRegisterHistory = async (month) => {
    const url = month ? apiUrl(`/cash-register/history?month=${month}`) : apiUrl('/cash-register/history');
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};
