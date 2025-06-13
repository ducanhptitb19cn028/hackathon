import { apiService } from './api.service';
import { store } from '../store';
import { clearUser, setUser } from '../store/slices/userSlice';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types/models';
import { AxiosError } from 'axios';
import axios from 'axios';

export interface LoginCredentials {
  username: string; // email is used as username
  password: string;
}

export interface GoogleLoginCredentials {
  token: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

interface JwtPayload {
  exp: number;
  sub: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class AuthService {
  private readonly basePath = '/api/v1/auth';
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private user: User | null = null;

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(`${this.basePath}/login`, credentials);
    this.setToken(response.data.access_token);
    await this.fetchAndUpdateUserProfile();
    this.setupTokenRefresh();
    return response.data;
  }

  async googleLogin(credentials: GoogleLoginCredentials): Promise<GoogleLoginResponse> {
    try {
      console.log('Attempting Google login with token');
      const response = await apiService.post<GoogleLoginResponse>(`${this.basePath}/google/login`, credentials);
      console.log('Google login successful:', response.data);
      this.setToken(response.data.access_token);
      await this.fetchAndUpdateUserProfile();
      this.setupTokenRefresh();
      return response.data;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  async register(data: {
    email: string;
    password: string;
    username: string;
    full_name: string;
  }): Promise<User> {
    const response = await apiService.post<User>(`${this.basePath}/register`, data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    console.log('Fetching current user profile...');
    const response = await apiService.get<User>(`${this.basePath}/me`);
    store.dispatch(setUser(response.data));
    return response.data;
  }

  private async fetchAndUpdateUserProfile(): Promise<void> {
    console.log('Fetching and updating user profile...');
    try {
      const user = await this.getCurrentUser();
      console.log('Successfully fetched user profile:', user);
      store.dispatch(setUser(user));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error instanceof AxiosError && error.response && 
          (error.response.status === 401 || error.response.status === 403)) {
        console.error('Authentication error, attempting token refresh...');
        await this.refreshToken();
      } else {
        console.error('Failed to fetch user profile:', error);
      }
    }
  }

  public async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    const email = localStorage.getItem('userEmail');
    
    if (!refreshToken || !email) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post('/auth/refresh', {
        email,
        refresh_token: refreshToken
      });

      const { access_token } = response.data;
      this.setToken(access_token);
      this.setupTokenRefresh();
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  private setupTokenRefresh(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      const refreshTime = expiresIn - 5 * 60 * 1000; // Refresh 5 minutes before expiry

      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }

      if (refreshTime > 0) {
        this.tokenRefreshTimeout = setTimeout(() => {
          this.refreshToken();
        }, refreshTime);
      } else {
        this.refreshToken();
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Getting token from localStorage:', token ? 'Token exists' : 'No token found');
    return token;
  }

  setToken(token: string): void {
    console.log('Setting token in localStorage...');
    localStorage.setItem(this.tokenKey, token);
    apiService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token set in localStorage and API headers');
  }

  removeToken(): void {
    console.log('Removing token from localStorage...');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    delete apiService.defaults.headers.common['Authorization'];
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    console.log('Token removed from localStorage and API headers');
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      const isExpired = decoded.exp < currentTime;
      console.log('Token expiration check:', {
        currentTime: new Date(currentTime * 1000).toISOString(),
        expirationTime: new Date(decoded.exp * 1000).toISOString(),
        isExpired
      });
      return isExpired;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  isAuthenticated(): boolean {
    console.log('Checking authentication status...');
    const token = this.getToken();
    if (!token) {
      console.log('No token found, not authenticated');
      return false;
    }
    
    try {
      if (this.isTokenExpired(token)) {
        console.warn('Token has expired, attempting refresh');
        this.refreshToken();
        return false;
      }
      
      // Verify token format
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded || !decoded.sub || !decoded.exp) {
        console.warn('Invalid token format, logging out');
        this.logout();
        return false;
      }
      
      console.log('Token is valid, user is authenticated');
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error instanceof Error ? error.message : error);
      this.logout();
      return false;
    }
  }

  logout(): void {
    console.log('Logging out...');
    this.removeToken();
    store.dispatch(clearUser());
    console.log('Logout complete');
  }
}

export const authService = new AuthService(); 