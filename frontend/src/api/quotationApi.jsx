import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const createQuotation = async (data) => {
    const response = await fetch(apiUrl('/quotations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
    });
    return parseJsonResponse(response);
};

export const getQuotations = async (status) => {
    const url = status ? apiUrl(`/quotations?status=${status}`) : apiUrl('/quotations');
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const getQuotation = async (id) => {
    const response = await fetch(apiUrl(`/quotations/${id}`), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const updateQuotation = async (id, data) => {
    const response = await fetch(apiUrl(`/quotations/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
    });
    return parseJsonResponse(response);
};

export const deleteQuotation = async (id) => {
    const response = await fetch(apiUrl(`/quotations/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const convertToSale = async (id, data) => {
    const response = await fetch(apiUrl(`/quotations/${id}/convert`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
    });
    return parseJsonResponse(response);
};
