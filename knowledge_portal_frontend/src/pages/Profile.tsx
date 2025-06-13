import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateUserProfile } from '../store/slices/userSlice';
import { UserLearningPathProgress, ProfileUpdate } from '../types/models';
import { userService } from '../services/user.service';

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const learningPaths = useSelector((state: RootState) => state.learningPath.availablePaths);
  const quizHistory = useSelector((state: RootState) => state.quiz.quizHistory);
  const [pathProgress, setPathProgress] = useState<Record<string, UserLearningPathProgress>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPathProgress = async () => {
      if (user && learningPaths.length > 0) {
        const progressData: Record<string, UserLearningPathProgress> = {};
        for (const path of learningPaths) {
          try {
            const response = await fetch(
              `/api/learning-paths/${path.id}/progress?userId=${user.id}`,
            );
            if (response.ok) {
              const data = await response.json();
              progressData[path.id] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch progress for path ${path.id}:`, error);
          }
        }
        setPathProgress(progressData);
      }
    };

    fetchPathProgress();
  }, [user, learningPaths]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    full_name: user?.full_name || '',
    skill_level: user?.skill_level || 'beginner',
    interests: user?.interests || []
  });

  useEffect(() => {
    // Update form data when user data changes
    if (user) {
      setFormData({
        email: user.email || '',
        username: user.username || '',
        full_name: user.full_name || '',
        skill_level: user.skill_level || 'beginner',
        interests: user.interests || []
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user?.id) {
      setError('User not found');
      setIsLoading(false);
      return;
    }

    try {
      // Match the backend's ProfileUpdate schema exactly
      const profileData: ProfileUpdate = {
        email: formData.email || null,
        username: formData.username || null,
        full_name: formData.full_name || null,
        skill_level: formData.skill_level || null,
        interests: formData.interests || null
      };

      const updatedUser = await userService.updateProfile(String(user.id), profileData);
      
      // Update the local state with the new profile data
      dispatch(updateUserProfile(updatedUser));
      
      setIsEditing(false);
      setError('Profile updated successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('Profile update error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            Please log in to view your profile
          </Typography>
          <Button variant="contained" color="primary" href="/login">
            Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        <Grid container spacing={4}>
          {/* Profile Information */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  src="/avatar.jpg"
                  alt={user.username}
                />
                {isEditing ? (
                  <Box>
                    <TextField
                      fullWidth
                      label="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      margin="normal"
                      disabled
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Skill Level</InputLabel>
                      <Select
                        value={formData.skill_level}
                        label="Skill Level"
                        onChange={(e) => handleInputChange('skill_level', e.target.value)}
                        disabled={isLoading}
                      >
                        <MenuItem value="Beginner">Beginner</MenuItem>
                        <MenuItem value="Intermediate">Intermediate</MenuItem>
                        <MenuItem value="Advanced">Advanced</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveProfile}
                      sx={{ mr: 1 }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {user.username}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {user.email}
                    </Typography>
                    <Chip 
                      label={user.skill_level || 'Beginner'} 
                      color="primary" 
                      sx={{ mb: 2 }} 
                    />
                    <Button variant="outlined" onClick={() => setIsEditing(true)} fullWidth>
                      Edit Profile
                    </Button>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Learning Preferences
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {user.interests?.map((interest: string) => (
                  <Chip key={interest} label={interest} variant="outlined" />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Learning Progress */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Learning Paths Progress
              </Typography>
              <List>
                {learningPaths.map((path) => {
                  const progress = pathProgress[path.id];
                  return (
                    <ListItem key={path.id} sx={{ display: 'block', mb: 2 }}>
                      <ListItemText primary={path.title} secondary={path.description} />
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress?.progress_percentage || 0}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Progress: {Math.round(progress?.progress_percentage || 0)}%
                          {progress && (
                            <span>
                              {' '}
                              • {progress.completed_videos} of {progress.total_videos} videos
                              completed
                            </span>
                          )}
                        </Typography>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>

            {/* Quiz History */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Quiz Results
              </Typography>
              <Grid container spacing={2}>
                {quizHistory.slice(0, 4).map((attempt) => (
                  <Grid item xs={12} sm={6} key={attempt.quiz_id}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Score: {Math.round(attempt.score)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Time taken: {Math.floor(attempt.timeTaken / 60)}:
                          {(attempt.timeTaken % 60).toString().padStart(2, '0')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Completed: {new Date(attempt.completedAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile;
