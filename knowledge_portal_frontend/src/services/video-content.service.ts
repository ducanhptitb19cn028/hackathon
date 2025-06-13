import { apiService } from './api.service';
import { authService } from './auth.service';

export interface VideoContentResult {
  id: string;
  type: 'section' | 'segment' | 'summary' | 'generated_answer';
  similarity: number;
  text: string;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
}

export interface VideoContentResponse {
  results: VideoContentResult[];
}

class VideoContentService {
  private readonly base_path = '/api/v1/video-content-search';

  async searchContent(query: string): Promise<VideoContentResponse> {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const response = await apiService.post<VideoContentResponse>(`${this.base_path}/query`, {
      query,
    });
    return response.data;
  }

  getGeneratedAnswer(results: VideoContentResult[]): VideoContentResult | undefined {
    return results.find(result => result.type === 'generated_answer');
  }

  getRelevantSegments(results: VideoContentResult[]): VideoContentResult[] {
    return results
      .filter(result => result.type !== 'generated_answer')
      .sort((a, b) => b.similarity - a.similarity);
  }

  formatTimestamp(timestamp: string | null): string {
    if (!timestamp) return '';
    return timestamp;
  }
}

export const videoContentService = new VideoContentService(); 