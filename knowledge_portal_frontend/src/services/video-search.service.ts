import { apiService } from './api.service';

export interface VideoSearchResult {
  id: string;
  type: 'section' | 'segment' | 'summary' | 'generated_answer';
  similarity: number;
  text: string;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
  video_id?: string | null;
}

export interface VideoSearchResponse {
  results: VideoSearchResult[];
}

class VideoSearchService {
  private readonly base_path = '/api/v1/video-content-search';

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

  getGeneratedAnswer(results: VideoSearchResult[]): VideoSearchResult | null {
    return results.find(result => result.type === 'generated_answer') || null;
  }

  getRelevantSegments(results: VideoSearchResult[]): VideoSearchResult[] {
    return results.filter(result => result.type !== 'generated_answer')
      .sort((a, b) => b.similarity - a.similarity);
  }

  // Helper method to format similarity as percentage
  formatSimilarity(similarity: number): string {
    return `${Math.round(similarity * 100)}%`;
  }

  // Helper method to parse time format (e.g., "0:00:41" to seconds)
  parseTimeToSeconds(timeStr: string | null): number | null {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return null;
  }

  // Helper method to format seconds back to time string
  formatSecondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export const videoSearchService = new VideoSearchService(); 