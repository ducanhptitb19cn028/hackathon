import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import theme from './theme';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Search from './pages/Search';
import VideoContentSearch from './pages/VideoContentSearch';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Quiz from './pages/Quiz';
import LearningPath from './pages/LearningPath';
import QuizHistory from './pages/QuizHistory';
import PrivateRoute from './components/Auth/PrivateRoute';

// Make sure to replace this with your actual client ID if not using environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const App: React.FC = () => {
  console.log('Google Client ID:', GOOGLE_CLIENT_ID);
  
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID is not configured!');
    return null;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error('Google Script failed to load')}
      onScriptLoadSuccess={() => console.log('Google Script loaded successfully')}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <Search />
                </PrivateRoute>
              }
            />
            <Route
              path="/video-content-search"
              element={
                <PrivateRoute>
                  <VideoContentSearch />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/take/:quizId"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/video/:videoId"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz-history"
              element={
                <PrivateRoute>
                  <QuizHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/learning-path"
              element={
                <PrivateRoute>
                  <LearningPath />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
