export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  avatar_url?: string;
  profile_info: {
    skill_level: string;
    interests: string[];
  };
  created_at: string;
  updated_at: string;
  skill_level?: string;
  interests?: string[];
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  skill_level: string;
  interests: string[];
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  title: string;
  description?: string;
  url: string;
  duration: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  category?: string;
  difficulty_level?: string;
  tags?: string[];
  completed?: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  target_skills: string[];
  difficulty_level: string;
  videos: Video[];
  progress: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLearningPathProgress {
  learning_path_id: number;
  user_id: number;
  total_videos: number;
  completed_videos: number;
  progress_percentage: number;
  estimated_remaining_time: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  time_limit: number;
  passing_score: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface QuizAttempt {
  answers: Record<string, number>;
}

export interface UserProgress {
  id: string;
  user_id: string;
  item_id: string; // video_id or path_id
  item_type: 'video' | 'path';
  completion_percentage: number;
  time_spent: number;
  quiz_scores: {
    quiz_id: string;
    score: number;
    completed_at: string;
  }[];
  last_accessed: string;
}

export interface SearchQuery {
  id: string;
  user_id: string;
  query_text: string;
  search_results: Video[];
  timestamp: string;
  feedback_score: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'quiz' | 'learning_path';
  category: string;
  difficulty_level?: string;
  duration?: number;
  thumbnail_url?: string;
  relevance_score: number;
  tags: string[];
}

export interface ProfileUpdate {
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  skill_level?: string | null;
  interests?: string[] | null;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}
