import axios from 'axios';
import { apiUrl } from './config';
import { getAuthHeader } from './authApi';

const API_URL = apiUrl('/repairs');

export const createRepair = async (repairData) => {
    const response = await axios.post(API_URL, repairData, { headers: getAuthHeader() });
    return response.data;
};

export const getRepairs = async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
};

export const deleteRepair = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
};

export const updateRepair = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData, { headers: getAuthHeader() });
    return response.data;
};
