import authService from './authService';

const API_URL = `${process.env.BACKEND_BASE_URL_DEV}api/v1/items`;

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

export const getItems = async (page = 1, limit = 10, filters = {}) => {
  // Build query params, only include filters if they have values
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  
  // Add filters only if they exist and have values
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  const response = await fetch(`${API_URL}?${params}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to fetch items');
    throw new Error(errorMessage);
  }
  return response.json();
};

// Get items that allow mixed carton for relationship configuration
// Note: Backend limits max 100 items per request
// If you have more than 100 mixable items, this will fetch multiple pages
export const getMixableItems = async () => {
  try {
    // First, get first page to check total
    const firstPage = await getItems(1, 100, { allow_mixed_carton: true });
    
    // Handle different response structures
    let allItems = [];
    let totalItems = 0;
    
    if (firstPage?.data?.data && Array.isArray(firstPage.data.data)) {
      // Paginated response: {success, data: {data: [...], pagination: {...}}}
      allItems = firstPage.data.data;
      totalItems = firstPage.data.pagination?.total || allItems.length;
    } else if (firstPage?.data && Array.isArray(firstPage.data)) {
      // Response: {success, data: [...]}
      allItems = firstPage.data;
      totalItems = allItems.length;
    } else if (Array.isArray(firstPage)) {
      // Direct array response
      allItems = firstPage;
      totalItems = allItems.length;
    }
    
    // If there are more items, fetch remaining pages
    if (totalItems > 100) {
      const totalPages = Math.ceil(totalItems / 100);
      const remainingPages = [];
      
      for (let page = 2; page <= totalPages; page++) {
        remainingPages.push(getItems(page, 100, { allow_mixed_carton: true }));
      }
      
      const results = await Promise.all(remainingPages);
      
      // Combine all results
      results.forEach(result => {
        if (result?.data?.data && Array.isArray(result.data.data)) {
          allItems = allItems.concat(result.data.data);
        } else if (result?.data && Array.isArray(result.data)) {
          allItems = allItems.concat(result.data);
        } else if (Array.isArray(result)) {
          allItems = allItems.concat(result);
        }
      });
    }
    
    // Return in consistent format
    return {
      success: true,
      data: allItems
    };
  } catch (error) {
    console.error('Failed to fetch mixable items:', error);
    throw error;
  }
};

export const getItemById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to fetch item');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const searchItems = async (query, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to search items');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const createItem = async (itemData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(itemData)
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to create item');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const updateItem = async (id, itemData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(itemData)
  });
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to update item');
    throw new Error(errorMessage);
  }
  return response.json();
};

export const deleteItem = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.status === 204) {
    return null; // Successfully deleted, no content to return
  }

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response, 'Failed to delete item');
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
  let filename = 'Item_Template.xlsx';
  
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

export const uploadBulkItem = async (file) => {
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

