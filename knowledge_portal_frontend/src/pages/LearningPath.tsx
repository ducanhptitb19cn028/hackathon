import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCurrentPath, updatePathProgress } from '../store/slices/learningPathSlice';
import { learningPathService } from '../services/learning-path.service';

interface PathFormData {
  goal: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hoursPerWeek: number;
  interests: string[];
}

interface PathProgress {
  completed_videos: number;
  total_videos: number;
  progress_percentage: number;
}

const initialFormData: PathFormData = {
  goal: '',
  skillLevel: 'beginner',
  hoursPerWeek: 5,
  interests: [],
};

const LearningPath: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPath } = useSelector((state: RootState) => state.learningPath);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PathFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<PathProgress | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (currentPath && user) {
        try {
          const pathProgress = await learningPathService.getLearningPathProgress(
            String(currentPath.id),
            String(user.id)
          );
          setProgress(pathProgress);
        } catch (err) {
          console.error('Failed to fetch progress:', err);
        }
      }
    };

    fetchProgress();
  }, [currentPath, user]);

  const handleFormChange = (field: keyof PathFormData, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePath = async () => {
    try {
      if (!user) {
        setError('Please log in to generate a learning path');
        return;
      }

      if (!formData.interests || formData.interests.length === 0) {
        setError('Please select at least one skill or interest');
        return;
      }

      const path = await learningPathService.generatePersonalizedPath(
        user.id.toString(),
        formData.interests,
        formData.hoursPerWeek * 60,  // Convert hours to minutes
        formData.skillLevel
      );

      dispatch(setCurrentPath(path));
      setActiveStep(1);
      setError(null);
    } catch (err) {
      console.error('Failed to generate learning path:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate learning path. Please try again.');
    }
  };

  const handleVideoComplete = async (videoId: number) => {
    if (currentPath && user) {
      try {
        await learningPathService.markVideoAsCompleted(
          String(currentPath.id),
          String(videoId),
          String(user.id)
        );
        // Refresh progress
        const pathProgress = await learningPathService.getLearningPathProgress(
          String(currentPath.id),
          String(user.id)
        );
        setProgress(pathProgress);
      } catch (err) {
        setError('Failed to update progress. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Personalized Learning Path
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Set Your Goals</StepLabel>
          </Step>
          <Step>
            <StepLabel>Follow Your Path</StepLabel>
          </Step>
          <Step>
            <StepLabel>Track Progress</StepLabel>
          </Step>
        </Stepper>

        {activeStep === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tell us about your learning goals
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="What do you want to achieve?"
                  value={formData.goal}
                  onChange={(e) => handleFormChange('goal', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Current Skill Level</InputLabel>
                  <Select
                    value={formData.skillLevel}
                    label="Current Skill Level"
                    onChange={(e) => handleFormChange('skillLevel', e.target.value)}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Hours per week"
                  value={formData.hoursPerWeek}
                  onChange={(e) => handleFormChange('hoursPerWeek', parseInt(e.target.value))}
                  InputProps={{ inputProps: { min: 1, max: 40 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGeneratePath}
                  disabled={!formData.goal}
                >
                  Generate Learning Path
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {activeStep === 1 && currentPath && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {currentPath.title}
              </Typography>
              <Typography color="text.secondary" paragraph>
                {currentPath.description}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Target Skills:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentPath.target_skills.map((skill, index) => (
                    <Chip key={index} label={skill} variant="outlined" size="small" />
                  ))}
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress?.progress_percentage || 0} 
                sx={{ mb: 1 }} 
              />
              <Typography variant="body2" color="text.secondary">
                Progress: {Math.round(progress?.progress_percentage || 0)}%
                {progress && ` • ${progress.completed_videos} of ${progress.total_videos} videos completed`}
              </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom>
              Course Content
            </Typography>
            <List>
              {currentPath.videos.map((video, index) => (
                <ListItem key={video.id} component={Paper} sx={{ mb: 2, borderRadius: 1 }}>
                  <ListItemIcon>
                    {progress && index < progress.completed_videos ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <PlayCircleOutlineIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={video.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {video.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={`${Math.floor(video.duration)} min`} size="small" />
                          {video.category && <Chip label={video.category} size="small" />}
                          {video.difficulty_level && <Chip label={video.difficulty_level} size="small" />}
                        </Box>
                      </>
                    }
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleVideoComplete(video.id)}
                    sx={{ ml: 2 }}
                  >
                    Watch
                  </Button>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default LearningPath;
