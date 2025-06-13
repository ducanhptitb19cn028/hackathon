import { apiService } from './api.service';
import { LearningPath } from '../types/models';

export interface LearningPathProgress {
  completed_videos: number;
  total_videos: number;
  progress_percentage: number;
}

export interface LearningPathUpdate {
  title?: string;
  description?: string;
  target_skills?: string[];
  videos?: string[];
}

interface LearningPathCreate {
  title: string;
  description: string;
  target_skills: string[];
  videos: string[];
  difficulty_level?: string;
}

export class LearningPathService {
  private readonly basePath = '/api/learning-paths';

  // Create a new learning path
  async createLearningPath(data: LearningPathCreate): Promise<LearningPath> {
    const response = await apiService.post<LearningPath>(this.basePath, data);
    return response.data;
  }

  // Get all learning paths with pagination
  async getLearningPaths(skip = 0, limit = 10): Promise<LearningPath[]> {
    const response = await apiService.get<LearningPath[]>(`${this.basePath}?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  // Generate personalized learning path
  async generatePersonalizedPath(
    userId: string,
    targetSkills: string[],
    timeAvailable: number,
    skillLevel: string
  ): Promise<LearningPath> {
    try {
      const response = await apiService.post<LearningPath>(`${this.basePath}/generate`, {
        skills: targetSkills,
        difficulty_level: skillLevel,
        max_duration_hours: Math.ceil(timeAvailable / 60)  // Convert minutes to hours
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate learning path:', error);
      throw new Error('Failed to generate personalized learning path. Please try again later.');
    }
  }

  // Get learning path progress
  async getLearningPathProgress(pathId: string, userId: string): Promise<LearningPathProgress> {
    try {
      const response = await apiService.get<LearningPathProgress>(
        `${this.basePath}/${pathId}/progress?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning path progress:', error);
      throw new Error('Failed to fetch learning path progress. Please try again later.');
    }
  }

  // Mark video as completed in a learning path
  async markVideoAsCompleted(pathId: string, videoId: string, userId: string): Promise<void> {
    try {
      await apiService.post(`${this.basePath}/${pathId}/videos/${videoId}/complete`, { userId });
    } catch (error) {
      console.error('Failed to mark video as completed:', error);
      throw new Error('Failed to mark video as completed. Please try again later.');
    }
  }
}

export const learningPathService = new LearningPathService();
