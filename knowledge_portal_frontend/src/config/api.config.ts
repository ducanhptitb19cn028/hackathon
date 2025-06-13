export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};
