import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

const API_URL = apiUrl('/suppliers');

export const addSupplier = async (supplierData) => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(supplierData)
    });
    return parseJsonResponse(res);
};

export const getSuppliers = async () => {
    const res = await fetch(API_URL, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};

export const updateSupplier = async (id, updateData) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updateData)
    });
    return parseJsonResponse(res);
};

export const deleteSupplier = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};