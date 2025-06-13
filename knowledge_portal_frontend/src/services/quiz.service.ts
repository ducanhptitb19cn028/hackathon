import { apiService } from './api.service';
import { AxiosError } from 'axios';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  video_id: string;
  difficulty_level: string;
  questions: Question[];
  passing_score: number;
  time_limit: number;
}

export interface QuizRequest {
  video_id: string;
  difficulty_level: string;
  num_questions: number;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: number[];
  user_id: string;
  submitted_at?: string;  // ISO string format
}

export interface QuizResult {
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  correct_answers: boolean[];
  explanations: string[];
  submitted_at: string;  // ISO string format
}

class QuizService {
  private readonly base_path = '/api/v1/quizzes';

  // Get quiz by ID
  async getQuizById(id: string): Promise<Quiz> {
    const response = await apiService.get<Quiz>(`${this.base_path}/${id}`);
    return response.data;
  }

  // Get available quizzes
  async getAvailableQuizzes(): Promise<Quiz[]> {
    try {
      const response = await apiService.get<Quiz[]>(`${this.base_path}/available`);
      // Ensure each quiz has at least an empty questions array
      return response.data.map(quiz => ({
        ...quiz,
        questions: quiz.questions || []
      }));
    } catch (error) {
      console.error('Failed to fetch available quizzes:', error);
      throw error;
    }
  }

  // Generate a quiz for a video
  async generateQuiz(request: QuizRequest): Promise<Quiz> {
    try {
      console.log('Generating quiz with request:', request);
      const response = await apiService.post<Quiz>(`${this.base_path}/generate`, request);
      console.log('Generated quiz response:', {
        quiz_id: response.data.id,
        title: response.data.title,
        num_questions: response.data.questions.length
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      if (error instanceof AxiosError && error.response) {
        throw new Error(error.response.data.detail || error.message);
      }
      throw new Error('Failed to generate quiz. Please try again later.');
    }
  }

  // Submit quiz answers and get results
  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    try {
      // Ensure we have a submission timestamp
      const submissionData = {
        ...submission,
        submitted_at: submission.submitted_at || new Date().toISOString()
      };

      console.log('Submitting quiz to server:', {
        quiz_id: submissionData.quiz_id,
        answers: submissionData.answers,
        user_id: submissionData.user_id,
        submitted_at: submissionData.submitted_at
      });

      const response = await apiService.post<QuizResult>(`${this.base_path}/submit`, submissionData);

      // Parse the response data
      const result: QuizResult = {
        ...response.data,
        submitted_at: response.data.submitted_at // Already an ISO string from backend
      };

      console.log('Server response:', {
        quiz_id: result.quiz_id,
        score: result.score,
        passed: result.passed,
        num_correct: result.correct_answers.filter(Boolean).length,
        submitted_at: result.submitted_at
      });

      return result;
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      
      if (error instanceof AxiosError) {
        console.error('API Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If we have a detailed error message from the server, use it
        if (error.response?.data?.detail) {
          throw new Error(error.response.data.detail);
        }
      }
      
      // For other types of errors or if we don't have a detailed message
      throw new Error('Failed to submit quiz. Please try again later.');
    }
  }
}

export const quizService = new QuizService();
