import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LearningPath, Video } from '../../types/models';

interface LearningPathState {
  currentPath: LearningPath | null;
  availablePaths: LearningPath[];
  loading: boolean;
  error: string | null;
}

const initialState: LearningPathState = {
  currentPath: null,
  availablePaths: [],
  loading: false,
  error: null,
};

export interface VideoCompletionPayload {
  videoId: number;
  completed: boolean;
}

const learningPathSlice = createSlice({
  name: 'learningPath',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<LearningPath>) => {
      state.currentPath = action.payload;
      state.error = null;
    },
    setAvailablePaths: (state, action: PayloadAction<LearningPath[]>) => {
      state.availablePaths = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updatePathProgress: (state, action: PayloadAction<{ videoId: string; completed: boolean }>) => {
      if (state.currentPath) {
        const { videoId, completed } = action.payload;
        const updatedVideos = state.currentPath.videos.map(video => {
          if (String(video.id) === String(videoId)) {
            return { ...video, completed };
          }
          return video;
        });
        state.currentPath = {
          ...state.currentPath,
          videos: updatedVideos
        };
      }
    },
    clearCurrentPath: (state) => {
      state.currentPath = null;
      state.error = null;
    },
    markVideoCompleted: (state, action: PayloadAction<VideoCompletionPayload>) => {
      if (state.currentPath) {
        const { videoId, completed } = action.payload;
        const updatedVideos = state.currentPath.videos.map(video => {
          if (String(video.id) === String(videoId)) {
            return { ...video, completed };
          }
          return video;
        });
        state.currentPath.videos = updatedVideos;
      }
    },
  },
});

export const {
  setCurrentPath,
  setAvailablePaths,
  setLoading,
  setError,
  updatePathProgress,
  clearCurrentPath,
  markVideoCompleted,
} = learningPathSlice.actions;

export default learningPathSlice.reducer;
