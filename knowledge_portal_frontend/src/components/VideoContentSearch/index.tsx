import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { videoContentService, VideoContentResult } from '../../services/video-content.service';
import { authService } from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

const VideoContentSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VideoContentResult[]>([]);
  const [answer, setAnswer] = useState<VideoContentResult | undefined>();
  const [error, setError] = useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!authService.isAuthenticated()) {
      setShowAuthDialog(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await videoContentService.searchContent(query);
      setResults(videoContentService.getRelevantSegments(response.results));
      setAnswer(videoContentService.getGeneratedAnswer(response.results));
    } catch (err) {
      if (err instanceof Error && err.message === 'Authentication required') {
        setShowAuthDialog(true);
      } else {
        setError('Failed to search video content. Please try again.');
        console.error('Search error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Save current query to restore after login
    if (query) {
      sessionStorage.setItem('pendingVideoSearch', query);
    }
    navigate('/login');
  };

  const renderTimestamp = (start: string | null, end: string | null) => {
    if (!start && !end) return null;
    return (
      <Chip
        size="small"
        icon={<AccessTimeIcon />}
        label={`${videoContentService.formatTimestamp(start)} - ${videoContentService.formatTimestamp(end)}`}
        sx={{ mr: 1 }}
      />
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      {/* Search Input */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask anything about the video content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </Box>

      {/* Error Message */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Generated Answer */}
      {answer && !loading && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Answer
            </Typography>
            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {answer.text}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && !loading && (
        <>
          <Typography variant="h6" gutterBottom>
            Relevant Segments
          </Typography>
          <List>
            {results.map((result) => (
              <ListItem
                key={result.id}
                component={Paper}
                sx={{
                  mb: 2,
                  p: 2,
                  display: 'block',
                }}
              >
                <Box sx={{ mb: 1 }}>
                  <Chip
                    size="small"
                    label={result.type.toUpperCase()}
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                  {renderTimestamp(result.start_time, result.end_time)}
                  {result.speaker && (
                    <Chip
                      size="small"
                      icon={<PersonIcon />}
                      label={result.speaker}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {result.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Relevance: {Math.round(result.similarity * 100)}%
                </Typography>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && !error && (
        <Typography variant="body1" color="text.secondary" align="center">
          No results found for your query.
        </Typography>
      )}

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)}>
        <DialogTitle>Authentication Required</DialogTitle>
        <DialogContent>
          <Typography>
            Please log in to search video content.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuthDialog(false)}>Cancel</Button>
          <Button onClick={handleLogin} variant="contained" color="primary">
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoContentSearch; 