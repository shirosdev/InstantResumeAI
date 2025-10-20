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

  const fetchUserStatus = useCallback(async (force = false) => { // Add force parameter
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      console.log('[Auth] No access token, skipping status fetch');
      return userStatus; // Return potentially cached status if not forcing
    }
    // If not forcing and status already exists, return cached version
    if (!force && userStatus) {
        console.log('[Auth] Returning cached user status');
        return userStatus;
    }
    try {
      console.log(`[Auth] Fetching user status... (Force: ${force})`);
      const statusResponse = await authService.getUserStatus();
      if (statusResponse.data?.status) {
        console.log('[Auth] User status fetched:', statusResponse.data.status);
        setUserStatus(statusResponse.data.status); // Update state
        return statusResponse.data.status; // Return fresh status
      }
    } catch (err) {
      console.error("[Auth] Could not fetch user status:", err);
       // Handle potential 401/expired token during status fetch
       if (err.response && (err.response.status === 401 || err.response.status === 422)) {
           console.log('[Auth] Token expired during status fetch, logging out.');
           performLogout(true); // Perform silent logout
       }
    }
    return null; // Return null on error
  }, [userStatus, performLogout]); // Add userStatus and performLogout dependencies

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
    
    setUser(null);
    setUserStatus(null);
    setError(null);

    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setLoading(true);
      const { token, user: storedUser } = getStoredAuth();

      if (!token || !storedUser) {
        if (mounted) setLoading(false);
        return;
      }
      
      if (mounted) {
          setUser(storedUser);
          await fetchUserStatus();
          setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUserStatus]);

  const login = useCallback(async (loginIdentifier, password) => {
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
        sessionStorage.setItem('access_token', access_token);
        sessionStorage.setItem('refresh_token', refresh_token || '');
        sessionStorage.setItem('user_data', JSON.stringify(signedUpUser));
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
      sessionStorage.setItem('user_data', JSON.stringify(userData));
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