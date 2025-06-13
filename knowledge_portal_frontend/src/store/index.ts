import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import learningPathReducer from './slices/learningPathSlice';
import quizReducer from './slices/quizSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    learningPath: learningPathReducer,
    quiz: quizReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
