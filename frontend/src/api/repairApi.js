// repairApi.js
import axios from 'axios';
import { apiUrl } from './config';

const API_URL = apiUrl('/repairs');

export const createRepair = async (repairData) => {
    const response = await axios.post(API_URL, repairData);
    return response.data;
};

export const getRepairs = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const deleteRepair = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export const updateRepair = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData);
    return response.data;
};
