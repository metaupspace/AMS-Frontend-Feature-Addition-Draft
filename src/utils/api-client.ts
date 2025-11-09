// utils/api-client.ts
import { url } from "./base_url";
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: url || 'http://localhost:5050/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Don't add auth token to login, register, or refresh endpoints
        const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        );

        if (!isPublicEndpoint) {
          const token = this.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding auth token to request:', config.url);
          } else {
            console.log('No token found for request:', config.url);
          }
        } else {
          console.log('Skipping auth token for public endpoint:', config.url);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Response error:', error.response?.status, error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('Unauthorized request, clearing auth data');
          // Clear auth data on 401
          this.clearAuthData();
          
          // Redirect to login if not already there
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Get token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict';
  }

  // Public method to set token (used by auth context)
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Set token in cookie with 7 days expiration
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  }

  // Public method to clear auth data
  clearAuth(): void {
    this.clearAuthData();
  }

  // Public methods
  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response;
  }
}

export const apiClient = new ApiClient();