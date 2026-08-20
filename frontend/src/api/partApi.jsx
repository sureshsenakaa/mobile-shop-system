import axios from 'axios';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

const API_URL = apiUrl('/parts');

export const createPart = async (partData) => {
    const response = await axios.post(API_URL, partData, { headers: getAuthHeader() });
    return response.data;
};

export const getParts = async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
};

export const deletePart = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const updatePart = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData, { headers: getAuthHeader() });
    return response.data;
};
