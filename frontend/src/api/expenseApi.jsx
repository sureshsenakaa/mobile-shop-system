import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

export const addExpense = async (expenseData) => {
    const response = await fetch(apiUrl('/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(expenseData)
    });
    return parseJsonResponse(response);
};

export const getExpenses = async (month) => {
    const url = month ? apiUrl(`/expenses?month=${month}`) : apiUrl('/expenses');
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const getMonthlyExpenses = async (month) => {
    const url = month ? apiUrl(`/expenses/monthly?month=${month}`) : apiUrl('/expenses/monthly');
    const response = await fetch(url, { headers: { ...getAuthHeader() } });
    return parseJsonResponse(response);
};

export const updateExpense = async (id, updateData) => {
    const response = await fetch(apiUrl(`/expenses/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updateData)
    });
    return parseJsonResponse(response);
};

export const deleteExpense = async (id) => {
    const response = await fetch(apiUrl(`/expenses/${id}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(response);
};
