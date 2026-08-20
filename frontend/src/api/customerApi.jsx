import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const deleteCustomer = async (id) => {
    const response = await fetch(apiUrl(`/customers/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const addCustomer = async (customerData) => {
    const response = await fetch(apiUrl('/customers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(customerData)
    });
    return parseJsonResponse(response);
};

export const getCustomers = async () => {
    const response = await fetch(apiUrl('/customers'), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const getCustomerById = async (id) => {
    const response = await fetch(apiUrl(`/customers/${id}`), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const updateCustomer = async (id, updateData) => {
    const response = await fetch(apiUrl(`/customers/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updateData)
    });
    return parseJsonResponse(response);
};

export const payCustomerDebt = async (id, amount) => {
    const response = await fetch(apiUrl(`/customers/${id}/pay`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ amount })
    });
    return parseJsonResponse(response);
};