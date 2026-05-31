import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

export const addSale = async (saleData) => {
    const { getAuthHeader } = await import('./authApi');
    const response = await fetch(apiUrl('/sales'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(saleData)
    });
    return parseJsonResponse(response);
};

export const getSales = async () => {
    const response = await fetch(apiUrl('/sales'));
    return parseJsonResponse(response);
};

export const getDailySales = async () => {
    const response = await fetch(apiUrl('/sales/daily'));
    return parseJsonResponse(response);
};

export const getMonthlySummary = async (month) => {
    const url = month ? apiUrl(`/sales/summary?month=${month}`) : apiUrl('/sales/summary');
    const response = await fetch(url);
    return parseJsonResponse(response);
};

export const deleteSale = async (id) => {
    const { getAuthHeader } = await import('./authApi');
    const response = await fetch(apiUrl(`/sales/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const returnSale = async (id) => {
    const { getAuthHeader } = await import('./authApi');
    const response = await fetch(apiUrl(`/sales/${id}/return`), {
        method: 'POST',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};