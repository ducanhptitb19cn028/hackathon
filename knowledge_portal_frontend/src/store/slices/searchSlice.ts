import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchResult as ModelSearchResult } from '../../types/models';

type SearchResult = ModelSearchResult;

interface SearchState {
  query: string;
  results: SearchResult[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
    duration: {
      min: number | null;
      max: number | null;
    };
  };
}

const initialState: SearchState = {
  query: '',
  results: [],
  recentSearches: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    difficulty: null,
    duration: {
      min: null,
      max: null,
    },
  },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setResults: (state, action: PayloadAction<SearchResult[]>) => {
      state.results = action.payload;
    },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      if (!state.recentSearches.includes(action.payload)) {
        state.recentSearches = [action.payload, ...state.recentSearches.slice(0, 9)];
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setQuery,
  setResults,
  addRecentSearch,
  clearRecentSearches,
  setLoading,
  setError,
  setFilters,
  clearFilters,
} = searchSlice.actions;

export default searchSlice.reducer; 