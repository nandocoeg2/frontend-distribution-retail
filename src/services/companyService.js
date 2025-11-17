import authService from './authService';

const API_URL = `${process.env.BACKEND_BASE_URL_DEV}api/v1/companies`;

const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getCompanies = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch companies' } }));
    throw new Error(errorData.error?.message || 'Failed to fetch companies');
  }
  return response.json();
};

export const getCompanyById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch company' } }));
    throw new Error(errorData.error?.message || 'Failed to fetch company');
  }
  return response.json();
};

export const searchCompanies = async (query, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to search companies' } }));
    throw new Error(errorData.error?.message || 'Failed to search companies');
  }
  return response.json();
};

export const createCompany = async (companyData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(companyData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to create company' } }));
    throw new Error(errorData.error?.message || 'Failed to create company');
  }
  return response.json();
};

export const updateCompany = async (id, companyData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(companyData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to update company' } }));
    throw new Error(errorData.error?.message || 'Failed to update company');
  }
  return response.json();
};

export const deleteCompany = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.status === 204) {
    return null; // Successfully deleted, no content to return
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to delete company' } }));
    throw new Error(errorData.error?.message || 'Failed to delete company');
  }

  return response.json();
};

export default {
  getCompanies,
  getCompanyById,
  searchCompanies,
  createCompany,
  updateCompany,
  deleteCompany
};
