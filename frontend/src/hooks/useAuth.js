// frontend/src/hooks/useAuth.js

import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import authService from '../services/authService';

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const AuthContext = createContext(null);

// Helper function to update last activity time
const updateLastActivityTime = () => {
  if (localStorage.getItem('access_token')) {
      localStorage.setItem('lastActivityTime', Date.now().toString());
  }
};

// Helper function to get stored auth data
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user_data');
    const lastActivity = localStorage.getItem('lastActivityTime');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { user, token, lastActivity };
    }
  } catch (error) {
    console.error('Error reading stored auth:', error);
  }
  return { user: null, token: null, lastActivity: null };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  // This function is the single source of truth for updating the user's status
  const fetchUserStatus = useCallback(async () => {
    if (!localStorage.getItem('access_token')) return;
    try {
      const statusResponse = await authService.getUserStatus();
      if (statusResponse.data?.status) {
        setUserStatus(statusResponse.data.status);
      }
    } catch (err) {
      console.error("Could not fetch user status:", err);
    }
  }, []);

  const performLogout = useCallback(async (isSilent = false) => {
    if (!isSilent) {
        console.log('Logging out...');
    }
    
    try {
      await authService.logout();
    } catch (err) {
      if (!isSilent) {
          console.error('Logout API call failed:', err);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('lastActivityTime');
    
    // --- FIX: Clear the enhancement result from session storage on logout ---
    sessionStorage.removeItem('lastEnhancementResult');
    
    setUser(null);
    setUserStatus(null);
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      const { token, user: storedUser, lastActivity } = getStoredAuth();

      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
          if (mounted) {
            await performLogout(true);
            setLoading(false);
          }
          return;
        }
      } else {
          updateLastActivityTime();
      }

      if (storedUser && lastActivity) {
          if (mounted) {
              setUser(storedUser);
              await fetchUserStatus();
              setLoading(false);
          }
          return;
      }
      
      try {
        const response = await authService.getCurrentUser();
        if (mounted && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          updateLastActivityTime();
          await fetchUserStatus();
        } else {
          if (mounted) await performLogout(true);
        }
      } catch (err) {
        if (mounted) await performLogout(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [performLogout, fetchUserStatus]);

  useEffect(() => {
    if (!user || loading) {
      return;
    }

    let inactivityTimer = null;
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivityTime');
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
          performLogout();
        }
      } else {
        updateLastActivityTime();
      }
    };
    
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    const activityHandler = () => updateLastActivityTime();
    activityEvents.forEach(event => window.addEventListener(event, activityHandler, { passive: true }));
    inactivityTimer = setInterval(checkInactivity, 60 * 1000);

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, activityHandler));
      if (inactivityTimer) {
        clearInterval(inactivityTimer);
      }
    };
  }, [user, loading, performLogout]);

  const login = useCallback(async (loginIdentifier, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.login({ login: loginIdentifier, password });
      if (response.data?.user && response.data?.access_token) {
        const { user: loggedInUser, access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token || '');
        localStorage.setItem('user_data', JSON.stringify(loggedInUser));
        updateLastActivityTime();
        setUser(loggedInUser);
        await fetchUserStatus();
        setLoading(false);
        return { success: true };
      } else {
         throw new Error('Login response missing expected data.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      await performLogout(true);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [performLogout, fetchUserStatus]);

  const signup = useCallback(async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.data?.user && response.data?.access_token) {
        const { user: signedUpUser, access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token || '');
        localStorage.setItem('user_data', JSON.stringify(signedUpUser));
        updateLastActivityTime();
        setUser(signedUpUser);
        await fetchUserStatus();
        setLoading(false);
        return { success: true };
      } else {
        throw new Error('Signup response missing expected data.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      await performLogout(true);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [performLogout, fetchUserStatus]);

  const logout = useCallback(() => {
      performLogout();
  }, [performLogout]);

  const value = {
    user,
    loading,
    error,
    userStatus,
    fetchUserStatus,
    login,
    signup,
    logout,
    updateUserData: (userData) => {
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      updateLastActivityTime();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};