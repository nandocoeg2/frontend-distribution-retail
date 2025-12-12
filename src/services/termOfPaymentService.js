const API_URL = `${process.env.BACKEND_BASE_URL}api/v1/term-of-payments`;

const getHeaders = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

const getAuthHeader = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${accessToken}`,
  };
};

const handleAuthError = (navigate) => {
  localStorage.clear();
  navigate('/login');
  throw new Error('Session expired');
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

export const termOfPaymentService = {
  // Get all term of payments with pagination
  getAllTermOfPayments: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Get term of payment by ID
  getTermOfPaymentById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Create new term of payment
  createTermOfPayment: async (termOfPaymentData) => {
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(termOfPaymentData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Update term of payment
  updateTermOfPayment: async (id, termOfPaymentData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(termOfPaymentData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Delete term of payment
  deleteTermOfPayment: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // For successful DELETE requests that don't return JSON (e.g., 204 No Content)
        return { success: true, message: 'Term of payment deleted successfully' };
      }
    } catch (error) {
      throw error;
    }
  },

  // Search term of payments
  searchTermOfPayments: async (query, page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
    let filename = 'TermOfPayment_Template.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
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

  uploadBulkTermOfPayment: async (file) => {
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
  },

  /**
   * Export term of payments to Excel
   * @param {string} searchQuery - Optional search query to filter data
   */
  exportExcel: async (searchQuery = '') => {
    const url = searchQuery
      ? `${API_URL}/export-excel?q=${encodeURIComponent(searchQuery)}`
      : `${API_URL}/export-excel`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'Failed to export data');
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'TermOfPayments.xlsx';

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

    return { success: true, filename };
  }
};

export default termOfPaymentService;
