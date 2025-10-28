import authService from './authService';

const API_BASE_URL = 'http://localhost:5050/api/v1/stock-movements';

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const extractErrorMessage = (payload, fallbackMessage) => {
  if (!payload) {
    return fallbackMessage;
  }

  if (isNonEmptyString(payload)) {
    return payload.trim();
  }

  if (isNonEmptyString(payload?.message)) {
    return payload.message.trim();
  }

  if (isNonEmptyString(payload?.error)) {
    return payload.error.trim();
  }

  if (isNonEmptyString(payload?.error?.message)) {
    return payload.error.message.trim();
  }

  if (Array.isArray(payload?.issues) && payload.issues.length > 0) {
    const firstIssue = payload.issues[0];

    if (isNonEmptyString(firstIssue)) {
      return firstIssue.trim();
    }

    if (isNonEmptyString(firstIssue?.message)) {
      return firstIssue.message.trim();
    }
  }

  return fallbackMessage;
};

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const errorPayload = await response.json();
    return extractErrorMessage(errorPayload, fallbackMessage);
  } catch (error) {
    return fallbackMessage;
  }
};

const buildHeaders = () => {
  const token = authService.getToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return;
    }

    query.set(key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const getStockMovements = async ({
  page = 1,
  limit = 10,
  search,
  status,
  type,
  dateFilterType,
  startDate,
  endDate,
} = {}) => {
  const query = buildQueryString({
    page,
    limit,
    search,
    status,
    type,
    dateFilterType,
    startDate,
    endDate,
  });

  const response = await fetch(`${API_BASE_URL}${query}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to fetch stock movements'
    );
    throw new Error(message);
  }

  return response.json();
};

export const createStockIn = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/stock-in`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to create stock-in movement'
    );
    throw new Error(message);
  }

  return response.json();
};

export const createReturn = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/return`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to create return movement'
    );
    throw new Error(message);
  }

  return response.json();
};

export const classifyReturn = async (movementId, action) => {
  const response = await fetch(
    `${API_BASE_URL}/return/${movementId}/classify`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action }),
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(
      response,
      'Failed to classify return movement'
    );
    throw new Error(message);
  }

  return response.json();
};

