import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

export const deleteCustomer = async (id) => {
    const { getAuthHeader } = await import('./authApi');
    const response = await fetch(apiUrl(`/customers/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};
// Real API for Customer operations
export const addCustomer = async (customerData) => {
    const { getAuthHeader } = await import('./authApi');
    const response = await fetch(apiUrl('/customers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(customerData)
    });
    return parseJsonResponse(response);
};

export const getCustomers = async () => {
    const response = await fetch(apiUrl('/customers'));
    return parseJsonResponse(response);
};

export const getCustomerById = async (id) => {
    const response = await fetch(apiUrl(`/customers/${id}`));
    return parseJsonResponse(response);
};