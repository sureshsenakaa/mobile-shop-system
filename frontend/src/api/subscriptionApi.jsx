import { parseJsonResponse } from './_utils';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

// Shop Admin: Upload a bank slip
export const uploadSubscriptionSlip = async (formData) => {
    // Note: Do NOT set Content-Type header when sending FormData (Multer). 
    // Fetch automatically sets it to multipart/form-data with the correct boundary.
    const res = await fetch(apiUrl('/subscriptions/upload-slip'), {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData
    });
    return parseJsonResponse(res);
};

// Shop Admin: Get their own upload history
export const getSubscriptionHistory = async () => {
    const res = await fetch(apiUrl('/subscriptions/history'), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(res);
};

// Super Admin: Get all uploaded slips
export const getAllSubscriptions = async () => {
    const res = await fetch(apiUrl('/subscriptions/admin/all'), {
        headers: { ...getAuthHeader() }
    });
    return parseJsonResponse(res);
};

// Super Admin: Approve a slip
export const approveSubscription = async (id, extendMonths) => {
    const res = await fetch(apiUrl(`/subscriptions/admin/approve/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ extendMonths })
    });
    return parseJsonResponse(res);
};

// Super Admin: Reject a slip
export const rejectSubscription = async (id, reason) => {
    const res = await fetch(apiUrl(`/subscriptions/admin/reject/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ reason })
    });
    return parseJsonResponse(res);
};
