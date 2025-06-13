import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setUser } from '../../store/slices/userSlice';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const checkAndFetchUser = async () => {
      console.log('PrivateRoute: Checking user session...', {
        pathname: location.pathname,
        hasUser: !!user,
        hasToken: !!authService.getToken()
      });

      const token = authService.getToken();
      if (!token || authService.isTokenExpired(token)) {
        console.log('PrivateRoute: No token or expired token, logging out');
        authService.logout();
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.log('PrivateRoute: Token valid but no user data, fetching user profile...');
        try {
          const userData = await authService.getCurrentUser();
          console.log('PrivateRoute: Successfully fetched user profile', userData);
          dispatch(setUser(userData));
        } catch (error) {
          console.error('PrivateRoute: Failed to fetch user:', error);
          if (error instanceof Error && error.message.includes('session has expired')) {
            console.log('PrivateRoute: Session expired, logging out');
            authService.logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAndFetchUser();
  }, [dispatch, user, location.pathname]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authService.isAuthenticated()) {
    console.log('PrivateRoute: User not authenticated, redirecting to login');
    // Save the attempted URL for redirecting after login
    if (location.pathname !== '/login') {
      console.log('PrivateRoute: Saving redirect URL:', location.pathname);
      sessionStorage.setItem('redirectUrl', location.pathname + location.search);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    console.log('PrivateRoute: No user data in store, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('PrivateRoute: User authenticated and loaded, rendering protected content');
  return <>{children}</>;
};

export default PrivateRoute; 