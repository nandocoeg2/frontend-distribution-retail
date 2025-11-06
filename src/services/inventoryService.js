import authService from './authService';

const API_URL = 'http://localhost:5050/api/v1/inventories';

const extractErrorMessage = (errorData, fallbackMessage) => {
  if (!errorData) {
    return fallbackMessage;
  }

  if (typeof errorData === 'string' && errorData.trim()) {
    return errorData;
  }

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (typeof errorData.error === 'string' && errorData.error.trim()) {
    return errorData.error;
  }

  if (errorData.error && typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
    return errorData.error.message;
  }

  if (Array.isArray(errorData.errors) && errorData.errors.length) {
    const firstError = errorData.errors[0];

    if (typeof firstError === 'string' && firstError.trim()) {
      return firstError;
    }

    if (firstError && typeof firstError.message === 'string' && firstError.message.trim()) {
      return firstError.message;
    }
  }

  return fallbackMessage;
};

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const errorData = await response.json();
    return extractErrorMessage(errorData, fallbackMessage);
  } catch (error) {
    return fallbackMessage;
  }
};

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
    const errorMessage = await parseErrorMessage(response, 'Failed to fetch inventories');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const getInventoryById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to fetch inventory');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const searchInventories = async (query, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to search inventories');
    throw new Error(errorMessage);
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
    const errorMessage = await parseErrorMessage(response, 'Failed to create inventory');
    throw new Error(errorMessage);
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
    const errorMessage = await parseErrorMessage(response, 'Failed to update inventory');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const deleteInventory = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.status === 204) {
    return null; // Successfully deleted, no content to return
  }

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to delete inventory');
    throw new Error(errorMessage);
  }

  return response.json();
};

// Bulk Upload Methods

export const downloadBulkTemplate = async () => {
  const token = authService.getToken();
  const response = await fetch(`${API_URL}/bulk/template`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to download template');
    throw new Error(errorMessage);
  }

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'Inventory_Template.xlsx';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  // Convert response to blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  return { success: true, filename };
};

export const uploadBulkInventory = async (file) => {
  const token = authService.getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/bulk/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to upload file');
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getBulkUploadStatus = async (bulkId) => {
  const response = await fetch(`${API_URL}/bulk/status/${bulkId}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to get bulk upload status');
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getAllBulkFiles = async (status = null) => {
  const url = status 
    ? `${API_URL}/bulk/files?status=${encodeURIComponent(status)}`
    : `${API_URL}/bulk/files`;
    
  const response = await fetch(url, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to get bulk files');
    throw new Error(errorMessage);
  }

  return response.json();
};

