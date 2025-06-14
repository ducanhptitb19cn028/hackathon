import { SearchResult } from '../types/models';
import { apiService } from './api.service';
import { videoSearchService, VideoSearchResponse } from './video-search.service';

export class SearchService {
  private readonly basePath = '/api/v1';

  async search(query: string): Promise<SearchResult[]> {
    try {
      const response = await apiService.post<SearchResult[]>(`${this.basePath}/video-search/query`, {
        query,
        page: 1,
        per_page: 10
      });
      return response.data || [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async searchVideoContent(query: string): Promise<VideoSearchResponse> {
    try {
      return await videoSearchService.searchVideo(query);
    } catch (error) {
      console.error('Video content search failed:', error);
      return { results: [] };
    }
  }
}

export const searchService = new SearchService(); 