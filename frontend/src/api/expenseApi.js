import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';

export const addExpense = async (expenseData) => {
    const response = await fetch(apiUrl('/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
    });
    return parseJsonResponse(response);
};

export const getExpenses = async (month) => {
    const url = month ? apiUrl(`/expenses?month=${month}`) : apiUrl('/expenses');
    const response = await fetch(url);
    return parseJsonResponse(response);
};

export const getMonthlyExpenses = async (month) => {
    const url = month ? apiUrl(`/expenses/monthly?month=${month}`) : apiUrl('/expenses/monthly');
    const response = await fetch(url);
    return parseJsonResponse(response);
};
