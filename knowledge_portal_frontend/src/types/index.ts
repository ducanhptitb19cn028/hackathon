// User Types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  learningPreferences: string[];
  createdAt: string;
  updatedAt: string;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  metadata: {
    tags: string[];
    topics: string[];
    skills: string[];
  };
}

// Learning Path Types
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: number;
  prerequisites: string[];
  learningOutcomes: string[];
  videos: Video[];
  progress: number;
}

// Quiz Types
export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: number[];
  user_id: string;
  submitted_at?: string;
}

export interface QuizResult {
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  correct_answers: boolean[];
  explanations: string[];
  submitted_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  videoId: string;
  questions: Question[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  passingScore: number;
  timeLimit: number;
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, number>;
  score: number;
  timeTaken: number;
  completedAt: string;
}

// Search Types
export interface SearchResult extends Video {
  relevanceScore: number;
  thumbnailUrl: string;
}

export interface SearchFilters {
  category: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  duration: {
    min: number | null;
    max: number | null;
  };
}

// State Types
export interface RootState {
  user: {
    profile: UserProfile | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  learningPath: {
    currentPath: LearningPath | null;
    availablePaths: LearningPath[];
    loading: boolean;
    error: string | null;
  };
  search: {
    query: string;
    results: SearchResult[];
    recentSearches: string[];
    loading: boolean;
    error: string | null;
    filters: SearchFilters;
  };
  quiz: {
    currentQuiz: Quiz | null;
    currentAttempt: QuizAttempt | null;
    quizHistory: QuizAttempt[];
    loading: boolean;
    error: string | null;
  };
}
