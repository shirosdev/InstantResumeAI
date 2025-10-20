// frontend/src/hooks/useAuth.js

import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  try {
    const token = sessionStorage.getItem('access_token');
    const userStr = sessionStorage.getItem('user_data');

    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { user, token };
    }
  } catch (error) {
    console.error('Error reading stored auth:', error);
  }
  return { user: null, token: null };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  // --- START REVISION ---
  // Define performLogout first, as fetchUserStatus might depend on it.
  const performLogout = useCallback(async (isSilent = false) => {
    setLoading(true);
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
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('lastEnhancementResult');
    sessionStorage.removeItem('disclaimerAgreed'); // Ensure this is also cleared
    setUser(null);
    setUserStatus(null);
    setError(null);
    setLoading(false);
  }, []); // performLogout has no dependencies on state within AuthProvider


  // Now define fetchUserStatus
  const fetchUserStatus = useCallback(async (force = false) => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      console.log('[Auth] No access token, skipping status fetch');
      // Return the current state if available, otherwise null
      return userStatus; // Return potentially cached status
    }

    // If not forcing and status already exists in state, return cached version
    if (!force && userStatus) {
        console.log('[Auth] Returning cached user status');
        return userStatus;
    }

    try {
      console.log(`[Auth] Fetching user status... (Force: ${force})`);
      const statusResponse = await authService.getUserStatus(); // Call the service
      
      // Check if response has data and status before updating state
      if (statusResponse?.data?.status) {
        console.log('[Auth] User status fetched:', statusResponse.data.status);
        setUserStatus(statusResponse.data.status); // Update state
        return statusResponse.data.status; // Return the fresh status
      } else {
        console.warn('[Auth] getUserStatus response did not contain expected data.');
        // Optionally, handle this case, e.g., by clearing status or returning null
        // setUserStatus(null); // Uncomment if you want to clear status on invalid response
        return null;
      }
    } catch (err) {
      console.error("[Auth] Could not fetch user status:", err);
       // Handle potential 401/expired token during status fetch
       if (err.response && (err.response.status === 401 || err.response.status === 422)) {
           console.log('[Auth] Token expired during status fetch, logging out.');
           // Use the already defined performLogout function
           performLogout(true); // Perform silent logout
       }
       return null; // Return null on error
    }
  // Make sure dependencies are correct. performLogout is defined outside useCallback's scope.
  // userStatus is included because we check it inside the function.
  }, [userStatus, performLogout]); // Add performLogout as dependency
  // --- END REVISION ---


  // useEffect for initial auth check (remains mostly the same)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      const { token, user: storedUser } = getStoredAuth();

      if (!token || !storedUser) {
        if (mounted) setLoading(false);
        return;
      }

      // Ensure user state is set BEFORE trying to fetch status if possible
      if (mounted) {
        setUser(storedUser);
        // Fetch status *after* setting user, if needed immediately
        // Consider if fetchUserStatus is truly needed during initial load
        // It might be better fetched only when components need it.
        await fetchUserStatus(); // Fetch initial status
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  // Ensure fetchUserStatus is in the dependency array if initAuth depends on it.
  }, [fetchUserStatus]); // Added fetchUserStatus dependency


  // login, signup, logout callbacks remain the same, just ensure they use the correct dependencies

  const login = useCallback(async (loginIdentifier, password) => {
    // ... (login logic remains the same, ensure it calls fetchUserStatus correctly) ...
     setError(null);
    setLoading(true);
    try {
      const response = await authService.login({ login: loginIdentifier, password });
      if (response.data?.user && response.data?.access_token) {
        const { user: loggedInUser, access_token, refresh_token } = response.data;
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token || '');
        sessionStorage.setItem('user_data', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        await fetchUserStatus(); // Fetch status after successful login
        setLoading(false);
        return { success: true };
      } else {
         throw new Error('Login response missing expected data.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      await performLogout(true); // Use performLogout
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [performLogout, fetchUserStatus]); // Added dependencies

  const signup = useCallback(async (userData) => {
    // ... (signup logic remains the same, ensure it calls fetchUserStatus correctly) ...
    setError(null);
    setLoading(true);
    try {
      const response = await authService.register(userData);
      if (response.data?.user && response.data?.access_token) {
        const { user: signedUpUser, access_token, refresh_token } = response.data;
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token || '');
        sessionStorage.setItem('user_data', JSON.stringify(signedUpUser));
        setUser(signedUpUser);
        await fetchUserStatus(); // Fetch status after successful signup
        setLoading(false);
        return { success: true };
      } else {
        throw new Error('Signup response missing expected data.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      await performLogout(true); // Use performLogout
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [performLogout, fetchUserStatus]); // Added dependencies

  // logout uses performLogout, which is already defined with useCallback
  const logout = useCallback(() => {
      performLogout(); // Call the stable performLogout function
  }, [performLogout]); // Dependency is performLogout

  // updateUserData remains simple state update
  const updateUserData = useCallback((newUserData) => {
      setUser(newUserData);
      sessionStorage.setItem('user_data', JSON.stringify(newUserData));
    }, []); // No dependencies needed here

  // Memoize the context value
  const value = {
    user,
    loading,
    error,
    userStatus,
    fetchUserStatus,
    login,
    signup,
    logout,
    updateUserData // Include the memoized update function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};