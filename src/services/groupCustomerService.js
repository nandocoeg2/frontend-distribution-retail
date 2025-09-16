const API_URL = 'http://localhost:5050/api/v1/group-customers';

const getHeaders = () => {
  const accessToken = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

export const groupCustomerService = {
  // Get all group customers with pagination
  getAllGroupCustomers: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to fetch group customers');

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Get group customer by ID
  getGroupCustomerById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to fetch group customer');

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Create new group customer
  createGroupCustomer: async (groupCustomerData) => {
    try {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(groupCustomerData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to create group customer');

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Update group customer
  updateGroupCustomer: async (id, groupCustomerData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(groupCustomerData),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to update group customer');

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Delete group customer
  deleteGroupCustomer: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to delete group customer');

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Search group customers
  searchGroupCustomers: async (query, page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized');
      }

      if (!response.ok) throw new Error('Failed to search group customers');

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export default groupCustomerService;

