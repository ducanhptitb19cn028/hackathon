import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const QuizHistory: React.FC = () => {
  const quizHistory = useSelector((state: RootState) => state.quiz.quizHistory);

  if (!quizHistory.length) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            Quiz History
          </Typography>
          <Typography color="text.secondary">
            You haven&apos;t taken any quizzes yet.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Quiz History
        </Typography>
        <Grid container spacing={3}>
          {quizHistory.map((attempt) => (
            <Grid item xs={12} sm={6} md={4} key={`${attempt.quiz_id}-${attempt.completedAt}`}>
              <Card>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Quiz Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={attempt.score}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {Math.round(attempt.score)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={`Time: ${Math.floor(attempt.timeTaken / 60)}:${(
                        attempt.timeTaken % 60
                      )
                        .toString()
                        .padStart(2, '0')}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={attempt.score >= 70 ? 'Passed' : 'Failed'}
                      color={attempt.score >= 70 ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block">
                    Completed: {new Date(attempt.completedAt).toLocaleDateString()} at{' '}
                    {new Date(attempt.completedAt).toLocaleTimeString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default QuizHistory; 