import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

// Real API for Supplier operations
const API_URL = apiUrl('/suppliers');

export const addSupplier = async (supplierData) => {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
    });
    return parseJsonResponse(res);
};

export const getSuppliers = async () => {
    const res = await fetch(API_URL);
    return parseJsonResponse(res);
};

export const updateSupplier = async (id, updateData) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });
    return parseJsonResponse(res);
};

export const deleteSupplier = async (id) => {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    return parseJsonResponse(res);
};