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

export const downloadProductTemplate = async () => {
    const res = await fetch(apiUrl('/products/template'), { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to download template');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Product_Upload_Template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
};

export const uploadBulkProducts = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = getAuthHeader();
    // Do not set Content-Type, fetch will automatically set it with the boundary for FormData
    
    const res = await fetch(apiUrl('/products/upload'), {
        method: 'POST',
        headers: headers,
        body: formData
    });
    return parseJsonResponse(res);
};

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
    const response = await fetch(apiUrl('/products'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const restockProduct = async (id, quantity, supplierId, imeiList, cost, price) => {
    const body = { quantity };
    if (supplierId) body.supplierId = supplierId;
    if (imeiList && imeiList.length > 0) body.imeiList = imeiList;
    if (cost !== undefined && cost !== '') body.cost = parseFloat(cost);
    if (price !== undefined && price !== '') body.price = parseFloat(price);
    const response = await fetch(apiUrl(`/products/${id}/restock`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
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