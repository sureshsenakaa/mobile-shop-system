import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const getStaff = async () => {
    const res = await fetch(apiUrl('/users/staff'), { headers: { ...getAuthHeader() } });
    return parseJsonResponse(res);
};

export const createStaff = async (userData) => {
    const res = await fetch(apiUrl('/users/staff'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(userData)
    });
    return parseJsonResponse(res);
};

export const deleteStaff = async (id) => {
    const res = await fetch(apiUrl(`/users/staff/${id}`), { 
        method: 'DELETE', 
        headers: { ...getAuthHeader() } 
    });
    return parseJsonResponse(res);
};

export const updateStaff = async (id, data) => {
    const res = await fetch(apiUrl(`/users/staff/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data)
    });
    return parseJsonResponse(res);
};
