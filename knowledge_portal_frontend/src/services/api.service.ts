import axios from 'axios';
import { authService } from './auth.service';

const apiService = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle auth token
apiService.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await authService.refreshToken();
        
        // Retry the original request with the new token
        const token = authService.getToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiService(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        authService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiService };

class ApiService {
  private api: typeof apiService;

  constructor() {
    this.api = apiService;
  }

  get defaults() {
    return this.api.defaults;
  }

  async get<T>(url: string, config?: any) {
    const response = await this.api.get<T>(url, config);
    return response;
  }

  async post<T>(url: string, data: unknown, config?: any) {
    const response = await this.api.post<T>(url, data, config);
    return response;
  }

  async put<T>(url: string, data: unknown, config?: any) {
    const response = await this.api.put<T>(url, data, config);
    return response;
  }

  async delete<T>(url: string, config?: any) {
    const response = await this.api.delete<T>(url, config);
    return response;
  }
}

export const apiServiceInstance = new ApiService();
