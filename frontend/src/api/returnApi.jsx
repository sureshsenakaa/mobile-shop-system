import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const getReturns = async () => {
    const response = await fetch(apiUrl('/returns'), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};

export const createReturn = async (returnData) => {
    const response = await fetch(apiUrl('/returns'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(returnData)
    });
    return parseJsonResponse(response);
};
