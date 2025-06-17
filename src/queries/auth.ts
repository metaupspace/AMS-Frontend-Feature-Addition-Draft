// queries/auth.ts

import { apiClient } from "@/utils/api-client";
import { LoginRequest, LoginResponse, User } from "@/models/auth";

export const authQueries = {
  // Login user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  // Get current user data (if needed for profile endpoint)
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/employee/profile");
    return response.data;
  },

  // Logout user (if server-side logout is needed)
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  // Refresh token (if needed)
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/refresh");
    return response.data;
  },

  // Verify token
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      const response = await apiClient.get("/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.status === 200;
    } catch {
      return false;
    }
  },
};