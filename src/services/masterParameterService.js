import authService from './authService';

const API_URL = `${process.env.BACKEND_BASE_URL}api/v1/master-parameters`;

const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getMasterParameters = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch master parameters' } }));
    throw new Error(errorData.error?.message || 'Failed to fetch master parameters');
  }
  return response.json();
};

export const getMasterParameterById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch master parameter' } }));
    throw new Error(errorData.error?.message || 'Failed to fetch master parameter');
  }
  return response.json();
};

export const getMasterParameterByKey = async (key) => {
  const response = await fetch(`${API_URL}/key/${encodeURIComponent(key)}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch master parameter' } }));
    throw new Error(errorData.error?.message || 'Failed to fetch master parameter');
  }
  return response.json();
};

export const searchMasterParameters = async (query, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to search master parameters' } }));
    throw new Error(errorData.error?.message || 'Failed to search master parameters');
  }
  return response.json();
};

export const createMasterParameter = async (parameterData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(parameterData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to create master parameter' } }));
    throw new Error(errorData.error?.message || 'Failed to create master parameter');
  }
  return response.json();
};

export const updateMasterParameter = async (id, parameterData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(parameterData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to update master parameter' } }));
    throw new Error(errorData.error?.message || 'Failed to update master parameter');
  }
  return response.json();
};

export const deleteMasterParameter = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.status === 204) {
    return null; // Successfully deleted, no content to return
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to delete master parameter' } }));
    throw new Error(errorData.error?.message || 'Failed to delete master parameter');
  }

  return response.json();
};

export default {
  getMasterParameters,
  getMasterParameterById,
  getMasterParameterByKey,
  searchMasterParameters,
  createMasterParameter,
  updateMasterParameter,
  deleteMasterParameter
};
