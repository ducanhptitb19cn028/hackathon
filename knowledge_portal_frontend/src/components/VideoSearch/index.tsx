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
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { videoSearchService, VideoSearchResult } from '../../services/video-search.service';
import StreamingText from '../StreamingText';

const VideoSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VideoSearchResult[]>([]);
  const [answer, setAnswer] = useState<VideoSearchResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await videoSearchService.searchVideo(query);
      setResults(videoSearchService.getRelevantSegments(response.results));
      setAnswer(videoSearchService.getGeneratedAnswer(response.results));
    } catch (err) {
      setError('Failed to search video content. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTimestamp = (start: string | null, end: string | null) => {
    if (!start && !end) return null;
    return (
      <Chip
        size="small"
        icon={<AccessTimeIcon />}
        label={`${videoSearchService.formatTimestamp(start)} - ${videoSearchService.formatTimestamp(end)}`}
        sx={{ mr: 1 }}
      />
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Video Content Search
      </Typography>

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
              AI Generated Answer
            </Typography>
            <StreamingText text={answer.text} />
            <Chip 
              label={videoSearchService.formatSimilarity(answer.similarity)} 
              size="small" 
              color="primary" 
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && !loading && (
        <>
          <Typography variant="h6" gutterBottom>
            Relevant Segments ({results.length})
          </Typography>
          <List>
            {results.map((result) => (
              <ListItem
                key={result.id}
                sx={{
                  mb: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <ListItemText
                  primary={
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
                          label={`Speaker ${result.speaker}`}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="div"
                        variant="body2"
                        color="text.primary"
                        sx={{ mb: 1 }}
                      >
                        {result.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Relevance: {videoSearchService.formatSimilarity(result.similarity)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default VideoSearch; 