import { apiService } from './api.service';
import { User, ProfileUpdate } from '../types/models';
import { authService } from './auth.service';
import { AxiosError } from 'axios';

class UserService {
  private readonly basePath = '/api/v1/users';

  async updateProfile(userId: string, data: ProfileUpdate): Promise<User> {
    try {
      // First try to validate the current session
      if (!authService.isAuthenticated()) {
        throw new Error('Your session has expired. Please log in again.');
      }

      // Validate skill_level if provided
      if (data.skill_level) {
        const allowedLevels = ['beginner', 'intermediate', 'advanced'];
        if (!allowedLevels.includes(data.skill_level.toLowerCase())) {
          throw new Error('Skill level must be one of: beginner, intermediate, advanced');
        }
        data.skill_level = data.skill_level.toLowerCase();
      }

      // Validate interests if provided
      if (data.interests) {
        if (data.interests.length > 20) {
          throw new Error('Maximum 20 interests allowed');
        }
        if (!data.interests.every(i => i.length >= 1 && i.length <= 50)) {
          throw new Error('Each interest must be between 1 and 50 characters');
        }
      }

      // Validate username if provided
      if (data.username && (data.username.length < 3 || data.username.length > 50)) {
        throw new Error('Username must be between 3 and 50 characters');
      }

      // Validate full_name if provided
      if (data.full_name && (data.full_name.length < 1 || data.full_name.length > 100)) {
        throw new Error('Full name must be between 1 and 100 characters');
      }

      const response = await apiService.put<User>(`${this.basePath}/${userId}/profile`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Your session has expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to update this profile.');
          case 404:
            throw new Error('Profile not found.');
          case 422:
            const validationError = error.response.data?.detail || 'Invalid profile data';
            throw new Error(`Validation error: ${validationError}`);
          default:
            throw new Error('Failed to update profile. Please try again later.');
        }
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  async getProfile(userId: string): Promise<User> {
    try {
      const response = await apiService.get<User>(`${this.basePath}/${userId}/profile`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('Your session has expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to view this profile.');
          case 404:
            throw new Error('Profile not found.');
          default:
            throw new Error('Failed to fetch profile. Please try again later.');
        }
      }
      throw new Error('Network error. Please check your connection and try again.');
    }
  }
}

export const userService = new UserService(); 