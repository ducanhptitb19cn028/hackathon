import { apiService } from './api.service';

export interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCreateInput {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface KnowledgeUpdateInput extends Partial<KnowledgeCreateInput> {}

export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

class KnowledgeService {
  private readonly basePath = '/api/v1/knowledge';

  // Get all knowledge entries with optional search parameters
  async getKnowledgeList(params?: SearchParams): Promise<{ items: Knowledge[]; total: number }> {
    const response = await apiService.get<{ items: Knowledge[]; total: number }>(`${this.basePath}`, { params });
    return response.data;
  }

  // Get a single knowledge entry by ID
  async getKnowledgeById(id: string): Promise<Knowledge> {
    const response = await apiService.get<Knowledge>(`${this.basePath}/${id}`);
    return response.data;
  }

  // Create a new knowledge entry
  async createKnowledge(data: KnowledgeCreateInput): Promise<Knowledge> {
    const response = await apiService.post<Knowledge>(this.basePath, data);
    return response.data;
  }

  // Update an existing knowledge entry
  async updateKnowledge(id: string, data: KnowledgeUpdateInput): Promise<Knowledge> {
    const response = await apiService.put<Knowledge>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  // Delete a knowledge entry
  async deleteKnowledge(id: string): Promise<void> {
    await apiService.delete<void>(`${this.basePath}/${id}`);
  }

  // Get all categories
  async getCategories(): Promise<string[]> {
    const response = await apiService.get<string[]>(`${this.basePath}/categories`);
    return response.data;
  }

  // Get all tags
  async getTags(): Promise<string[]> {
    const response = await apiService.get<string[]>(`${this.basePath}/tags`);
    return response.data;
  }

  // Search knowledge entries
  async searchKnowledge(searchTerm: string): Promise<Knowledge[]> {
    const response = await apiService.get<Knowledge[]>(`${this.basePath}/search`, { params: { query: searchTerm } });
    return response.data;
  }
}

export const knowledgeService = new KnowledgeService();
