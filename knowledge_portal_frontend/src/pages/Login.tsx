import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { authService } from '../services/auth.service';
import { setUser } from '../store/slices/userSlice';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authService.login({ username: email, password });
      dispatch(setUser(response.user));
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await authService.googleLogin({ token: credentialResponse.credential });
      dispatch(setUser(response.user));
      navigate('/');
    } catch (err) {
      setError('Google login failed');
      console.error('Google login error:', err);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
            >
              Login
            </Button>
          </form>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 