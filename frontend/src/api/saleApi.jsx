import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const addSale = async (saleData) => {
    const response = await fetch(apiUrl('/sales'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(saleData)
    });
    return parseJsonResponse(response);
};

export const getSales = async () => {
    const response = await fetch(apiUrl('/sales'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const getDailySales = async () => {
    const response = await fetch(apiUrl('/sales/daily'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const getMonthlySummary = async (month) => {
    const url = month ? apiUrl(`/sales/summary?month=${month}`) : apiUrl('/sales/summary');
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const deleteSale = async (id) => {
    const response = await fetch(apiUrl(`/sales/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const returnSale = async (id) => {
    const response = await fetch(apiUrl(`/sales/${id}/return`), {
        method: 'POST',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};