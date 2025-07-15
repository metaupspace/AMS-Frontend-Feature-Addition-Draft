// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authQueries } from '@/queries/auth';
import { employeeQueries } from '@/queries/employee';
import { apiClient } from '@/utils/api-client';
import { User } from '@/models/auth';
import { EmployeeProfile } from '@/models/employee';

interface AuthContextType {
  user: User | null;
  employee: EmployeeProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user && !!employee;

  // Get token from cookie
  const getTokenFromCookie = React.useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }, []);

  // Set token in cookie
  const setTokenInCookie = (token: string) => {
    if (typeof window === 'undefined') return;
    
    // Set cookie with 7 days expiration
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  };

  // Clear token from cookie
  const clearTokenFromCookie = () => {
    if (typeof window === 'undefined') return;
    
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict';
  };

  // Fetch profile data from server
  const fetchProfileData = React.useCallback(async (): Promise<{ user: User; employee: EmployeeProfile } | null> => {
    try {
      console.log('Fetching profile data from server...');
      
      // Fetch employee profile which should contain all user data
      const profileData = await employeeQueries.getProfile();
      
      if (!profileData) {
        console.error('No profile data received');
        return null;
      }

      // Create user object from profile data
      const userData: User = {
        employeeId: profileData.employeeId,
        email: profileData.email,
        role: profileData.role,
        token: getTokenFromCookie() || '', // Get token from cookie
      };

      console.log('Profile data fetched successfully:', { 
        employeeId: userData.employeeId, 
        role: userData.role 
      });

      return { user: userData, employee: profileData };
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return null;
    }
  }, [getTokenFromCookie]);

    const clearAuthData = React.useCallback(() => {
    try {
      // Clear cookie
      clearTokenFromCookie();
      
      // Clear API client token
      apiClient.clearAuth();
      
      // Clear state
      setUser(null);
      setEmployee(null);
      
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, []);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Check if we're in the browser
        if (typeof window === 'undefined') {
          setIsInitialized(true);
          return;
        }

        const token = getTokenFromCookie();
        
        if (token) {
          console.log('Token found in cookie, fetching profile...');
          
          // Set token in API client
          apiClient.setToken(token);
          
          // Fetch fresh profile data from server
          const profileData = await fetchProfileData();
          
          if (profileData) {
            setUser(profileData.user);
            setEmployee(profileData.employee);
            console.log('Auth state initialized successfully');
          } else {
            console.log('Failed to fetch profile data, clearing auth');
            clearAuthData();
          }
        } else {
          console.log('No token found in cookie');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [clearAuthData, fetchProfileData, getTokenFromCookie]);

  const saveAuthData = (userData: User, employeeData: EmployeeProfile, token: string) => {
    try {
      // Save token to cookie
      setTokenInCookie(token);
      
      // Set token in API client
      apiClient.setToken(token);
      
      // Update state
      setUser(userData);
      setEmployee(employeeData);
      
      console.log('Auth data saved successfully');
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };



  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Starting login process...');
      
      // Clear any existing auth data first
      clearAuthData();
      
      const loginResponse = await authQueries.login({ email, password });
      console.log('Login response received:', { hasToken: !!loginResponse.token, hasUser: !!loginResponse.employeeId });
      
      if (!loginResponse.token || !loginResponse.employeeId) {
        console.error('Invalid login response - missing token or user data');
        return false;
      }

      // Set token temporarily for the profile request
      apiClient.setToken(loginResponse.token);
      
      // Fetch fresh profile data from server
      console.log('Fetching employee profile after login...');
      const profileData = await fetchProfileData();

      if (!profileData) {
        console.error('Failed to fetch employee profile');
        clearAuthData();
        return false;
      }

      // Save all auth data including token in cookie
      saveAuthData(profileData.user, profileData.employee, loginResponse.token);
      
      console.log('Login successful');
      return true;

    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear any partial auth data
      clearAuthData();
      
      // Re-throw the error so the UI can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    clearAuthData();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('Refreshing profile data...');
      
      const profileData = await fetchProfileData();

      if (profileData) {
        const currentToken = getTokenFromCookie();
        if (currentToken) {
          saveAuthData(profileData.user, profileData.employee, currentToken);
          console.log('Profile data refreshed successfully');
        }
      }
    } catch (error: any) {
      console.error('Error refreshing profile:', error);
      // If refresh fails due to auth issues, logout
      if (error?.response?.status === 401) {
        logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    employee,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}