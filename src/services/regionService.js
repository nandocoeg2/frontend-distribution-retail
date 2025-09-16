const API_URL = 'http://localhost:5050/api/v1/regions';

const getHeaders = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
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

      return await response.json();
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

      return await response.json();
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

      return await response.json();
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

      return await response.json();
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

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export default regionService;

