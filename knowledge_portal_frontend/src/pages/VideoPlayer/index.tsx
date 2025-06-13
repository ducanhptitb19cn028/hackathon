import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, Quiz as QuizIcon } from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { videoService } from '../../services/video.service';
import { quizService } from '../../services/quiz.service';
import { Video } from '../../types/models';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    data: videoData,
    loading: videoLoading,
    error: videoError,
    execute: fetchVideo,
  } = useApi<Video>(videoService.getVideoById);

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!id) return;

      try {
        const videoData = await videoService.getVideo(id);
        setVideo(videoData);
      } catch (err) {
        setError('Failed to load video');
        console.error('Error loading video:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [id]);

  const handleQuizStart = async () => {
    try {
      const quiz = await quizService.generateQuiz({ 
        video_id: id!, 
        difficulty_level: 'Medium',
        num_questions: 5 
      });
      navigate(`/quiz/${quiz.id}`);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
  };

  const handleProgressUpdate = async (newProgress: number) => {
    try {
      await videoService.updateVideoProgress(id!, newProgress);
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !video) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Video not found'}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    return hours > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${remainingMinutes} minutes`;
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Typography variant="h4" gutterBottom>
          {video.title}
        </Typography>
        <Box sx={{ mb: 2 }}>
          {video.tags?.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              variant="outlined"
              size="small"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
        <Box
          component="iframe"
          src={video.url}
          title={video.title}
          width="100%"
          height="600px"
          sx={{ border: 'none', mb: 3 }}
        />
        <Typography variant="body1" paragraph>
          {video.description}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" paragraph>
            Duration: {formatDuration(Math.floor(video.duration))}
          </Typography>
          {video.category && (
            <Typography variant="body2" paragraph>
              Category: {video.category}
            </Typography>
          )}
          {video.difficulty_level && (
            <Typography variant="body2" paragraph>
              Difficulty: {video.difficulty_level}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Back to Search
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoPlayer;
