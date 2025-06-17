// utils/api-client.ts
import { url } from "./base_url";
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: url || 'http://localhost:3001/api',
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
            console.log('Adding auth token to request:', config.url); // Debug log
          } else {
            console.log('No token found for request:', config.url); // Debug log
          }
        } else {
          console.log('Skipping auth token for public endpoint:', config.url); // Debug log
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
    
    // Try sessionStorage first
    let token = sessionStorage.getItem('token');
    
    // If not in sessionStorage, try to get from cookie as fallback
    if (!token) {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        // Store in sessionStorage for future use
        sessionStorage.setItem('token', token);
      }
    }
    
    return token;
  }

  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('employee');
    
    // Clear localStorage as fallback (in case there's old data)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('employee');
    
    // Clear cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Public method to set token (used by auth context)
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    sessionStorage.setItem('token', token);
    // Also set as cookie for SSR compatibility
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
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