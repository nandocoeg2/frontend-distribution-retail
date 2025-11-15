const API_URL = 'http://localhost:5050/api/v1/regions';

const getHeaders = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

const getAuthHeader = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${accessToken}`,
  };
};

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

export const regionService = {
  // Get all regions with pagination
  getAllRegions: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to fetch regions');

      const result = await response.json();
      
      // Return data in expected format
      return {
        data: result.data.data || [],
        meta: result.data.pagination ? {
          page: result.data.pagination.currentPage || 1,
          totalPages: result.data.pagination.totalPages || 1,
          total: result.data.pagination.totalItems || 0,
          limit: result.data.pagination.itemsPerPage || 10
        } : {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get region by ID
  getRegionById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to fetch region');

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new region
  createRegion: async (regionData) => {
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(regionData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to create region');

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Update region
  updateRegion: async (id, regionData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(regionData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to update region');

      const result = await response.json();
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete region
  deleteRegion: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to delete region');

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Search regions
  searchRegions: async (query, page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to search regions');

      const result = await response.json();
      
      // Return data in expected format
      return {
        data: result.data.data || [],
        meta: result.data.pagination ? {
          page: result.data.pagination.currentPage || 1,
          totalPages: result.data.pagination.totalPages || 1,
          total: result.data.pagination.totalItems || 0,
          limit: result.data.pagination.itemsPerPage || 10
        } : {
          page: 1,
          totalPages: 1,
          total: 0,
          limit: 10
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Bulk Upload Methods
  downloadBulkTemplate: async () => {
    const response = await fetch(`${API_URL}/bulk/template`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to download template');
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Region_Template.xlsx';
    
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
  },

  uploadBulkRegion: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/bulk/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to upload file');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getBulkUploadStatus: async (bulkId) => {
    const response = await fetch(`${API_URL}/bulk/status/${bulkId}`, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get bulk upload status');
      throw new Error(errorMessage);
    }

    return response.json();
  },

  getAllBulkFiles: async (status = null) => {
    const url = status 
      ? `${API_URL}/bulk/files?status=${encodeURIComponent(status)}`
      : `${API_URL}/bulk/files`;
      
    const response = await fetch(url, {
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to get bulk files');
      throw new Error(errorMessage);
    }

    return response.json();
  }
};

export default regionService;

