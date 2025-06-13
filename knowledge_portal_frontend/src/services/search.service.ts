import { SearchResult } from '../types/models';
import { apiService } from './api.service';

export class SearchService {
  private readonly base_path = '/api/v1/search';

  async search(query: string): Promise<SearchResult[]> {
    const response = await apiService.post<SearchResult[]>(`${this.base_path}/query`, {
      query,
    });
    return response.data;
  }
}

export const searchService = new SearchService(); 