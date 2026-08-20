import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const getShops = async () => {
    const res = await fetch(apiUrl('/shops'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};

export const createShop = async (shopData) => {
    const res = await fetch(apiUrl('/shops'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(shopData)
    });
    return parseJsonResponse(res);
};

export const updateShop = async (id, shopData) => {
    const res = await fetch(apiUrl(`/shops/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(shopData)
    });
    return parseJsonResponse(res);
};

export const createShopAdmin = async (shopId, userData) => {
    const res = await fetch(apiUrl(`/shops/${shopId}/admin`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(userData)
    });
    return parseJsonResponse(res);
};

export const getShopNotice = async () => {
    const res = await fetch(apiUrl('/shops/notice'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};
