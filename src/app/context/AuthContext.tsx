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

  // Initialize auth state from sessionStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're in the browser
        if (typeof window === 'undefined') {
          setIsInitialized(true);
          return;
        }

        const token = sessionStorage.getItem('token');
        const savedUser = sessionStorage.getItem('user');
        const savedEmployee = sessionStorage.getItem('employee');

        if (token && savedUser && savedEmployee) {
          try {
            const userData = JSON.parse(savedUser);
            const employeeData = JSON.parse(savedEmployee);
            
            setUser(userData);
            setEmployee(employeeData);
            
            // Verify token is still valid by making a test request
            await authQueries.getCurrentUser();
            
            console.log('Auth state restored from sessionStorage');
          } catch (error) {
            console.error('Invalid stored auth data or expired token:', error);
            clearAuthData();
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const saveAuthData = (userData: User, employeeData: EmployeeProfile, token: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('employee', JSON.stringify(employeeData));
      apiClient.setToken(token);
      
      setUser(userData);
      setEmployee(employeeData);
      
      console.log('Auth data saved to sessionStorage');
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const clearAuthData = () => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('employee');
      
      // Also clear localStorage as fallback (in case there's old data)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('employee');
      
      apiClient.clearAuth();
      
      setUser(null);
      setEmployee(null);
      
      console.log('Auth data cleared');
    } catch (error) {
      console.error('Error clearing auth data:', error);
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

      // Get employee profile
      console.log('Fetching employee profile...');
      // Set token temporarily for the profile request
      apiClient.setToken(loginResponse.token);
      
      const employeeProfile = await employeeQueries.getProfile();
      console.log('Employee profile received:', { hasProfile: !!employeeProfile });

      if (!employeeProfile) {
        console.error('Failed to fetch employee profile');
        clearAuthData();
        return false;
      }
      const user: User = {
        employeeId: loginResponse.employeeId,
        email: loginResponse.email,
        role: loginResponse.role,
        token: loginResponse.token,
      };
      // Save all auth data
      saveAuthData(user, employeeProfile, loginResponse.token);
      
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
      
      const [userData, employeeData] = await Promise.all([
        authQueries.getCurrentUser(),
        employeeQueries.getProfile()
      ]);

      if (userData && employeeData) {
        const currentToken = sessionStorage.getItem('token');
        if (currentToken) {
          saveAuthData(userData, employeeData, currentToken);
          console.log('Profile data refreshed');
        }
      }
    } catch (error) {
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