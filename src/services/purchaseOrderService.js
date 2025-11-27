const API_URL = `${process.env.BACKEND_BASE_URL}api/v1/purchase-orders`;

const purchaseOrderService = {
  // Get purchase orders with pagination and optional filters (supports both old and new signatures)
  getPurchaseOrders: function (params = {}) {
    // Support both old (page, limit) and new (params object) signatures for backward compatibility
    if (typeof params === 'number') {
      const page = params;
      const limit = typeof arguments[1] !== 'undefined' ? arguments[1] : 10;
      return this.getAllPurchaseOrders(page, limit);
    }

    // New params object signature for TanStack Query
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const url = new URL(`${API_URL}/`);

    // Add all parameters to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    return fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error?.message || 'Failed to fetch purchase orders');
        });
      }
      return response.json();
    });
  },

  // Get all purchase orders dengan pagination
  getAllPurchaseOrders: async (page = 1, limit = 10) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/?page=${page}&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch purchase orders');
    }

    return response.json();
  },

  // Get purchase order by ID
  getPurchaseOrderById: async (id) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch purchase order');
    }

    return response.json();
  },

  // Create purchase order dengan file upload
  createPurchaseOrder: async (formData, files = []) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const data = new FormData();

    // Append form data
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });

    // Append files
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        data.append('file', file);
      });
    }

    const response = await fetch(`${API_URL}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: data,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create purchase order');
    }

    return response.json();
  },

  // Update purchase order
  updatePurchaseOrder: async (id, updateData) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update purchase order');
    }

    return response.json();
  },

  // Delete purchase order
  deletePurchaseOrder: async (id) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete purchase order');
    }

    return response.status === 204 ? { success: true } : response.json();
  },

  // Search purchase orders
  searchPurchaseOrders: async (searchParams = {}, page = 1, limit = 10) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const url = new URL(`${API_URL}/search`);

    // Add search parameters
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] !== null && searchParams[key] !== undefined) {
        url.searchParams.append(key, searchParams[key]);
      }
    });

    // Add pagination
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to search purchase orders');
    }

    return response.json();
  },

  // Get purchase order history
  getPurchaseOrderHistory: async (page = 1, limit = 10) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/history?page=${page}&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch purchase order history');
    }

    return response.json();
  },

  // Process purchase order (single atau bulk)
  processPurchaseOrder: async (ids, statusCode = 'PROCESSING PURCHASE ORDER') => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // Pastikan ids adalah array
    const idsArray = Array.isArray(ids) ? ids : [ids];

    const response = await fetch(`${API_URL}/process`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ids: idsArray,
        status_code: statusCode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to process purchase order');
    }

    return response.json();
  },

  // Bulk process purchase orders
  bulkProcessPurchaseOrders: async (ids, statusCode = 'PROCESSING PURCHASE ORDER') => {
    return this.processPurchaseOrder(ids, statusCode);
  },

  // Bulk create purchase order
  bulkCreatePurchaseOrder: async (files) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const data = new FormData();
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        data.append('file', file);
      });
    }

    const response = await fetch(`${API_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: data,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to bulk create purchase orders');
    }

    return response.json();
  },

  // Get bulk upload status
  getBulkUploadStatus: async (fileId) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/bulk/status/${fileId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get bulk upload status');
    }

    return response.json();
  },

  // Get all bulk uploads
  getAllBulkUploads: async (status = null) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const url = new URL(`${API_URL}/bulk/all`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get bulk uploads');
    }

    return response.json();
  },

  // Get purchase orders by status code dengan pagination
  getPurchaseOrdersByStatus: async (statusCode, page = 1, limit = 10) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const url = new URL(`${API_URL}/search`);

    // Add status_code parameter if provided
    if (statusCode) {
      url.searchParams.append('status_code', statusCode);
    }

    // Add pagination
    url.searchParams.append('page', page);
    url.searchParams.append('limit', limit);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch purchase orders by status');
    }

    return response.json();
  },

  // Print documents
  printDocuments: async (id, documents) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/${id}/print-docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to print documents');
    }

    return response.json();
  },

  // Cancel purchase order
  cancelPurchaseOrder: async (id, alasan = null) => {
    const accessToken = localStorage.getItem('token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const body = alasan ? { alasan } : {};

    const response = await fetch(`${API_URL}/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Gagal membatalkan purchase order');
    }

    return response.json();
  }
};

export default purchaseOrderService;

