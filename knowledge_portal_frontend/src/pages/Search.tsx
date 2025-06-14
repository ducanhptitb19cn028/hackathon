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
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  SmartToy as AIIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setQuery, setResults, addRecentSearch, setLoading, setError } from '../store/slices/searchSlice';
import { searchService } from '../services/searchService';
import { SearchResult } from '../types/models';
import { VideoSearchResult, VideoSearchResponse } from '../services/video-search.service';
import { videoSearchService } from '../services/video-search.service';

const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { query, results, loading } = useSelector((state: RootState) => state.search);
  const [searchInput, setSearchInput] = useState(query);
  const [searchType, setSearchType] = useState<'video' | 'content'>('video');
  const [localError, setLocalError] = useState<string>('');
  const [videoContentResults, setVideoContentResults] = useState<VideoSearchResponse | null>(null);

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
    setVideoContentResults(null);

    try {
      if (searchType === 'video') {
        const searchResults = await searchService.search(searchQuery);
        dispatch(setResults(searchResults || []));
      } else {
        const contentResults = await searchService.searchVideoContent(searchQuery);
        setVideoContentResults(contentResults);
        dispatch(setResults([])); // Clear regular results when showing content results
      }
    } catch (error) {
      console.error('Search error:', error);
      setLocalError('Failed to search. Please try again.');
      dispatch(setResults([]));
      setVideoContentResults(null);
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
        navigate(`/quiz/take/${result.id}`);
        break;
      case 'learning_path':
        navigate(`/learning-path/${result.id}`);
        break;
    }
  };

  const handlePlaySegment = (segment: VideoSearchResult) => {
    // TODO: Implement video player integration
    console.log('Play segment:', segment);
    // This would typically open a video player at the specific timestamp
  };

  const renderGeneratedAnswer = (answer: VideoSearchResult) => (
    <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AIIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" color="primary">
          AI Generated Answer
        </Typography>
        <Chip 
          label={videoSearchService.formatSimilarity(answer.similarity)} 
          size="small" 
          color="primary" 
          sx={{ ml: 2 }}
        />
      </Box>
      <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {answer.text}
      </Typography>
    </Paper>
  );

  const renderVideoSegment = (segment: VideoSearchResult, index: number) => (
    <Card key={segment.id} sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoIcon color="action" />
            <Typography variant="subtitle2" color="text.secondary">
              Video Segment #{index + 1}
            </Typography>
            {segment.speaker && (
              <Chip label={`Speaker ${segment.speaker}`} size="small" variant="outlined" />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={videoSearchService.formatSimilarity(segment.similarity)} 
              size="small" 
              color="secondary"
            />
            {segment.start_time && (
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => handlePlaySegment(segment)}
                title="Play from this timestamp"
              >
                <PlayIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
          {segment.text}
        </Typography>

        {(segment.start_time || segment.end_time) && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Timestamp:
            </Typography>
            {segment.start_time && (
              <Chip 
                label={`Start: ${segment.start_time}`} 
                size="small" 
                variant="outlined"
              />
            )}
            {segment.end_time && (
              <Chip 
                label={`End: ${segment.end_time}`} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderVideoContentResults = () => {
    if (!videoContentResults) return null;

    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Video Content Search Results ({videoContentResults.results.length} found)
        </Typography>

        {videoContentResults.results.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No results found for "{searchInput}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try rephrasing your question or using different keywords.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Generated Answer Section */}
            {(() => {
              const generatedAnswer = videoSearchService.getGeneratedAnswer(videoContentResults.results);
              return generatedAnswer ? renderGeneratedAnswer(generatedAnswer) : null;
            })()}

            {/* Video Segments Section */}
            {(() => {
              const segments = videoSearchService.getRelevantSegments(videoContentResults.results);
              return segments.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                    Related Video Segments ({segments.length})
                  </Typography>
                  {segments.map((segment, index) => renderVideoSegment(segment, index))}
                </Box>
              ) : null;
            })()}
          </Box>
        )}
      </Box>
    );
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
              placeholder={searchType === 'content' ? "Ask a question about video content..." : "Search for videos and content..."}
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {localError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {searchType === 'content' ? (
            renderVideoContentResults()
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
        </>
      )}

      {/* Help Section for Content Search */}
      {searchType === 'content' && !videoContentResults && !loading && (
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            How to use Video Content Search
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Ask specific questions about video content
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Get AI-generated answers based on video transcripts
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • View relevant video segments with timestamps
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Click the play button to jump to specific moments in videos
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Search;
