import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

export const addInvestor = async (payload) => {
    const res = await fetch(apiUrl('/investors'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    return parseJsonResponse(res);
};

export const getInvestors = async () => {
    const res = await fetch(apiUrl('/investors'));
    return parseJsonResponse(res);
};

export const deleteInvestor = async (id) => {
    const res = await fetch(apiUrl(`/investors/${id}`), { method: 'DELETE' });
    return parseJsonResponse(res);
};

export const updateInvestor = async (id, payload) => {
    const res = await fetch(apiUrl(`/investors/${id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return parseJsonResponse(res);
};

export const recordInvestorPayment = async (id) => {
    const res = await fetch(apiUrl(`/investors/${id}/pay`), { method: 'POST' });
    return parseJsonResponse(res);
};
