import { apiService } from './api.service';

export interface VideoSearchResult {
  id: string;
  type: 'section' | 'segment' | 'summary' | 'generated_answer';
  similarity: number;
  text: string;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
}

export interface VideoSearchResponse {
  results: VideoSearchResult[];
}

class VideoSearchService {
  private readonly base_path = '/api/v1/video-search';

  async searchVideo(query: string): Promise<VideoSearchResponse> {
    const response = await apiService.post<VideoSearchResponse>(`${this.base_path}/query`, {
      query,
    });
    return response.data;
  }

  formatTimestamp(timestamp: string | null): string {
    if (!timestamp) return '';
    return timestamp;
  }

  getGeneratedAnswer(results: VideoSearchResult[]): string {
    const answer = results.find(result => result.type === 'generated_answer');
    return answer?.text || 'No answer generated.';
  }

  getRelevantSegments(results: VideoSearchResult[]): VideoSearchResult[] {
    return results.filter(result => result.type !== 'generated_answer')
      .sort((a, b) => b.similarity - a.similarity);
  }
}

export const videoSearchService = new VideoSearchService(); 