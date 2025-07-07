

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
  const [user, setUser] = useState(null); // Initialize user to null
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);

  // Stable logout function
  const performLogout = useCallback(async (isSilent = false) => {
    if (!isSilent) {
        console.log('Logging out...');
    }
    
    try {
      // Fire and forget logout API call
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
    setUser(null);
    setError(null);

    
  }, []);

  // Effect for Initial Authentication Check (runs once on mount)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      const { token, user: storedUser, lastActivity } = getStoredAuth();

      // 1. No token? Definitely not logged in.
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      // 2. Check inactivity based on stored timestamp
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
          console.log('User inactive on load, logging out.');
          if (mounted) {
            await performLogout(true); // Silent logout
            setLoading(false);
          }
          return;
        }
      } else {
          // Token exists but no activity time? Set it now.
          updateLastActivityTime();
      }

      // 3. *** MODIFIED LOGIC ***
      // If we have a token, stored user data, AND a recent activity timestamp,
      // initially trust the local state to avoid unnecessary logouts on transient /me failures.
      if (storedUser && lastActivity) {
          console.log('Found valid token, user data, and recent activity. Initializing from localStorage.');
          if (mounted) {
              setUser(storedUser); // Set user state from localStorage
              setLoading(false); // Stop loading
          }
          return; // Skip the immediate /me call
      }

      // 4. If local state is incomplete (e.g., no storedUser), validate with backend
      console.log('Local state incomplete or missing activity time. Validating session with /me endpoint.');
      try {
        const response = await authService.getCurrentUser();
        if (mounted && response.data?.user) {
          // Session is valid, update user state and local storage
          setUser(response.data.user);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          updateLastActivityTime(); // Ensure activity time is updated
        } else {
          // API returned OK but no user data, or error occurred (caught below)
          console.warn('Session validation via /me failed or returned no user data.');
          if (mounted) await performLogout(true); // Logout if validation fails
        }
      } catch (err) {
        console.error('Error validating user session via /me:', err);
        if (mounted) await performLogout(true); // Logout on error
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [performLogout]);

  // Effect for Inactivity Monitoring (runs when user is logged in)
  useEffect(() => {
    // Only run if user is logged in and initial loading is done
    if (!user || loading) {
      return;
    }

    let inactivityTimer = null;

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivityTime');
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        if (Date.now() - lastActivityTime > INACTIVITY_TIMEOUT) {
          console.log('User inactive, logging out.');
          performLogout(); // Use the stable logout function
        }
      } else {
        // If user is logged in but no activity time, update it now.
        console.warn('User logged in but no lastActivityTime found during check. Updating timestamp.');
        updateLastActivityTime();
      }
    };

    // Setup activity listeners
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, updateLastActivityTime, { passive: true }));

    // Start the inactivity check interval
    inactivityTimer = setInterval(checkInactivity, 60 * 1000); // Check every minute

    // Cleanup function for this effect
    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, updateLastActivityTime));
      if (inactivityTimer) {
        clearInterval(inactivityTimer);
      }
    };
    // Re-run when user logs in/out or loading finishes
  }, [user, loading, performLogout]);

  // Login function
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
        updateLastActivityTime(); // Set initial activity time
        setUser(loggedInUser); // Update user state
        setLoading(false);
        return { success: true };
      } else {
         throw new Error('Login response missing expected data.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      await performLogout(true); // Ensure clean state on login failure
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [performLogout]);

  // Signup function
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
  }, [performLogout]);

  // Expose the stable logout function, wrapped in useCallback for consistency
  const logout = useCallback(() => {
      performLogout();
  }, [performLogout]);

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

