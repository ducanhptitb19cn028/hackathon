import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setQuery, setResults, addRecentSearch, setLoading, setError } from '../store/slices/searchSlice';
import { searchService } from '../services/searchService';
import { SearchResult } from '../types/models';

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { query, results, loading } = useSelector((state: RootState) => state.search);
  const [searchInput, setSearchInput] = useState(query);
  const [searchType, setSearchType] = useState<'video' | 'content'>('video');
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    const state = location.state as { query?: string };
    if (state?.query) {
      setSearchInput(state.query);
      handleSearch(state.query);
    }
  }, [location.state]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    dispatch(setQuery(searchQuery));
    dispatch(addRecentSearch(searchQuery));
    dispatch(setLoading(true));
    dispatch(setError(null));
    setLocalError('');

    try {
      let searchResults;
      if (searchType === 'video') {
        searchResults = await searchService.search(searchQuery);
      } else {
        searchResults = await searchService.searchVideoContent(searchQuery);
      }
      dispatch(setResults(searchResults || []));
    } catch (error) {
      console.error('Search error:', error);
      setLocalError('Failed to search. Please try again.');
      dispatch(setResults([]));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const handleSearchTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: 'video' | 'content' | null,
  ) => {
    if (newType !== null) {
      setSearchType(newType);
      if (searchInput) {
        handleSearch(searchInput);
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'video':
        navigate(`/video/${result.id}`);
        break;
      case 'quiz':
        navigate(`/quiz/${result.id}`);
        break;
      case 'learning_path':
        navigate(`/learning-path/${result.id}`);
        break;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for videos and content..."
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={searchType}
              exclusive
              onChange={handleSearchTypeChange}
              aria-label="search type"
              fullWidth
            >
              <ToggleButton value="video" aria-label="video search">
                Video
              </ToggleButton>
              <ToggleButton value="content" aria-label="content search">
                Content
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {localError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {localError}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!Array.isArray(results) || results.length === 0 ? (
            <Typography variant="h6" align="center" color="text.secondary">
              No results found. Try a different search term.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item key={result.id} xs={12}>
                  <Card 
                    sx={{ display: 'flex', height: '100%', cursor: 'pointer' }}
                    onClick={() => handleResultClick(result)}
                  >
                    {result.thumbnail_url && (
                      <CardMedia
                        component="img"
                        sx={{ width: 240 }}
                        image={result.thumbnail_url}
                        alt={result.title}
                      />
                    )}
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {result.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {result.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip label={result.type} color="primary" size="small" />
                        <Chip label={result.category} size="small" />
                        {result.difficulty_level && (
                          <Chip label={result.difficulty_level} size="small" />
                        )}
                        {result.duration && (
                          <Chip label={`${Math.floor(result.duration)} min`} size="small" />
                        )}
                      </Box>
                      {result.tags && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {result.tags.map((tag) => (
                            <Chip key={tag} label={tag} variant="outlined" size="small" />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default Search;
