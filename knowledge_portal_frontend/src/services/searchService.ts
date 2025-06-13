import { SearchResult } from '../types/models';
import { apiService } from './api.service';

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

  async searchVideoContent(query: string): Promise<SearchResult[]> {
    try {
      const response = await apiService.post<SearchResult[]>(`${this.basePath}/video-content-search/query`, {
        query
      });
      return response.data || [];
    } catch (error) {
      console.error('Video content search failed:', error);
      return [];
    }
  }
}

export const searchService = new SearchService(); 