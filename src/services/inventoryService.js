import authService from './authService';

const API_URL = 'http://localhost:5050/api/v1/inventories';

const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getInventories = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch inventories');
  }
  return response.json();
};

export const getInventoryById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }
  return response.json();
};

export const searchInventories = async (query) => {
  const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to search inventories');
  }
  return response.json();
};

export const createInventory = async (inventoryData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(inventoryData)
  });
  if (!response.ok) {
    throw new Error('Failed to create inventory');
  }
  return response.json();
};

export const updateInventory = async (id, inventoryData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(inventoryData)
  });
  if (!response.ok) {
    throw new Error('Failed to update inventory');
  }
  return response.json();
};

export const deleteInventory = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to delete inventory');
  }
  return response.json();
};
