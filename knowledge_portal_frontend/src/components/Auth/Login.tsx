import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedirectAfterLogin = () => {
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectUrl');
      navigate(redirectUrl);
    } else {
      navigate('/');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({ username: email, password });
      handleRedirectAfterLogin();
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Failed to login with Google: No credentials received');
      return;
    }

    try {
      await authService.googleLogin({ token: credentialResponse.credential });
      handleRedirectAfterLogin();
    } catch (err) {
      setError('Failed to login with Google');
      console.error('Google login error:', err);
    }
  };

  const handleGoogleError = () => {
    setError('Failed to login with Google');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Log In
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleEmailLogin}>
          <TextField
            fullWidth
            label="Email"
            type="email"
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
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Log In'}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            type="standard"
            theme="filled_blue"
            size="large"
            text="signin_with"
            shape="rectangular"
            ux_mode="popup"
          />
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{' '}
            <Button color="primary" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login; 