import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Alert,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as AIIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { videoSearchService, VideoSearchResult, VideoSearchResponse } from '../services/video-search.service';
import StreamingText from '../components/StreamingText';

const VideoContentSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VideoSearchResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const searchResults = await videoSearchService.searchVideo(query);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search video content. Please try again.');
    } finally {
      setLoading(false);
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
      <StreamingText text={answer.text} />
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Video Content Search
      </Typography>

      {/* Search Form */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <TextField
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about video content..."
                variant="outlined"
                disabled={loading}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !query.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Search Results ({results.results.length} found)
          </Typography>

          {results.results.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No results found for "{query}"
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try rephrasing your question or using different keywords.
              </Typography>
            </Paper>
          ) : (
            <Box>
              {/* Generated Answer Section */}
              {(() => {
                const generatedAnswer = videoSearchService.getGeneratedAnswer(results.results);
                return generatedAnswer ? renderGeneratedAnswer(generatedAnswer) : null;
              })()}

              {/* Video Segments Section */}
              {(() => {
                const segments = videoSearchService.getRelevantSegments(results.results);
                return segments.length > 0 ? (
                  <Box>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                          Related Video Segments ({segments.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {segments.map((segment, index) => renderVideoSegment(segment, index))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ) : null;
              })()}
            </Box>
          )}
        </Box>
      )}

      {/* Help Section */}
      {!results && !loading && (
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

export default VideoContentSearch; 