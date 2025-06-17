// utils/cookies.ts

// Cookie utilities for token management
export const cookieUtils = {
  // Set token in cookie (for SSR compatibility)
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      // Also set in localStorage for client-side access
      localStorage.setItem('token', token);
      
      // Set cookie for SSR
      document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    }
  },

  // Get token from cookie or localStorage
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      // Try localStorage first
      const localToken = localStorage.getItem('token');
      if (localToken) return localToken;

      // Fallback to cookie
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          return value;
        }
      }
    }
    return null;
  },

  // Remove token from both cookie and localStorage
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Remove cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  // Check if token exists
  hasToken: (): boolean => {
    return !!cookieUtils.getToken();
  }
};