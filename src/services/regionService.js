const API_URL = 'http://localhost:5050/api/v1/regions';

const getHeaders = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
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
};

export default regionService;

