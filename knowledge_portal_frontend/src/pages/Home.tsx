import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Knowledge Portal
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Discover and learn from our extensive video content library
        </Typography>
        {isAuthenticated ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/search')}
            sx={{ mt: 4 }}
          >
            Start Searching
          </Button>
        ) : (
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Home;
