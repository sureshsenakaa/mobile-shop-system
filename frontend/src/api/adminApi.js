import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const getRevenueStats = async () => {
    const res = await fetch(apiUrl('/admin/revenue-stats'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};

export const getGlobalNotice = async () => {
    const res = await fetch(apiUrl('/admin/notice'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};

export const updateGlobalNotice = async (message) => {
    const res = await fetch(apiUrl('/admin/notice'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message })
    });
    return parseJsonResponse(res);
};
