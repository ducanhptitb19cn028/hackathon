import { apiService } from './api.service';
import { Video, SearchQuery } from '../types/models';

class VideoService {
  private readonly basePath = '/api/videos';

  // Natural language search for videos
  async searchVideos(query: string): Promise<SearchQuery> {
    const response = await apiService.post<SearchQuery>(`${this.basePath}/search`, { query });
    return response.data;
  }

  // Get video details
  async getVideoById(id: string): Promise<Video> {
    const response = await apiService.get<Video>(`${this.basePath}/${id}`);
    return response.data;
  }

  // Get recommended videos based on user profile and history
  async getRecommendedVideos(): Promise<Video[]> {
    const response = await apiService.get<Video[]>(`${this.basePath}/recommended`);
    return response.data;
  }

  // Get videos by category
  async getVideosByCategory(category: string): Promise<Video[]> {
    const response = await apiService.get<Video[]>(`${this.basePath}/category/${category}`);
    return response.data;
  }

  // Get trending videos
  async getTrendingVideos(): Promise<Video[]> {
    const response = await apiService.get<Video[]>(`${this.basePath}/trending`);
    return response.data;
  }

  // Track video progress
  async updateVideoProgress(videoId: string, progress: number): Promise<void> {
    await apiService.post<void>(`${this.basePath}/${videoId}/progress`, { progress });
  }

  async getVideo(id: string): Promise<Video> {
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }
    return response.json();
  }
}

export const videoService = new VideoService();
