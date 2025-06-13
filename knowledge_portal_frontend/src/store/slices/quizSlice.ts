import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Quiz as QuizType } from '../../services/quiz.service';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  video_id: string;
  difficulty_level: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit: number;
}

interface QuizAttempt {
  answers: Record<string, number>;
}

interface QuizState {
  currentQuiz: QuizType | null;
  currentAttempt: {
    answers: Record<string, number>;
  } | null;
  score: number | null;
  passed: boolean | null;
  correct_answers: boolean[] | null;
  explanations: string[] | null;
  timeTaken: number | null;
  quizHistory: {
    quiz_id: string;
    score: number;
    timeTaken: number;
    completedAt: string;
  }[];
}

const initialState: QuizState = {
  currentQuiz: null,
  currentAttempt: null,
  score: null,
  passed: null,
  correct_answers: null,
  explanations: null,
  timeTaken: null,
  quizHistory: [],
};

export const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setCurrentQuiz: (state, action: PayloadAction<QuizType>) => {
      state.currentQuiz = action.payload;
      state.currentAttempt = null;
      state.score = null;
      state.passed = null;
      state.correct_answers = null;
      state.explanations = null;
      state.timeTaken = null;
    },
    startQuiz: (state) => {
      state.currentAttempt = { answers: {} };
      state.score = null;
      state.passed = null;
      state.correct_answers = null;
      state.explanations = null;
      state.timeTaken = null;
    },
    answerQuestion: (
      state,
      action: PayloadAction<{ questionId: string; answer: number }>,
    ) => {
      if (state.currentAttempt) {
        state.currentAttempt.answers[action.payload.questionId] = action.payload.answer;
      }
    },
    completeQuiz: (
      state,
      action: PayloadAction<{
        score: number;
        timeTaken: number;
        passed: boolean;
        correct_answers: boolean[];
        explanations: string[];
      }>,
    ) => {
      state.score = action.payload.score;
      state.timeTaken = action.payload.timeTaken;
      state.passed = action.payload.passed;
      state.correct_answers = action.payload.correct_answers;
      state.explanations = action.payload.explanations;

      if (state.currentQuiz) {
        state.quizHistory.push({
          quiz_id: state.currentQuiz.id,
          score: action.payload.score,
          timeTaken: action.payload.timeTaken,
          completedAt: new Date().toISOString(),
        });
      }
    },
  },
});

export const { setCurrentQuiz, startQuiz, answerQuestion, completeQuiz } = quizSlice.actions;

export default quizSlice.reducer;
