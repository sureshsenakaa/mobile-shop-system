import { getAuthHeader, isTokenValid } from './authApi';
import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

export const deleteProduct = async (id) => {
    const response = await fetch(apiUrl(`/products/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};
// Real API for Product operations
export const addProduct = async (productData) => {
    if (!isTokenValid()) {
        throw new Error('Invalid or expired token');
    }
    const response = await fetch(apiUrl('/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(productData)
    });
    const data = await parseJsonResponse(response);
    return data;
};

export const getProducts = async () => {
    const response = await fetch(apiUrl('/products'));
    return parseJsonResponse(response);
};

export const restockProduct = async (id, quantity, supplierId) => {
    const body = { quantity };
    if (supplierId) body.supplierId = supplierId;
    const response = await fetch(apiUrl(`/products/${id}/restock`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return parseJsonResponse(response);
};

export const updateProduct = async (id, productData) => {
    if (!id) throw new Error('Product id required');
    const response = await fetch(apiUrl(`/products/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(productData)
    });
    const data = await parseJsonResponse(response);
    return data;
};