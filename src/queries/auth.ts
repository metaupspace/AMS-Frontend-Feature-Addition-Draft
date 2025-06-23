// queries/auth.ts
import { apiClient } from "@/utils/api-client";
import { LoginRequest, LoginResponse, User } from "@/models/auth";

export const authQueries = {
  // Login user
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  // Get current user data from profile endpoint
  getCurrentUser: async (): Promise<User> => {
    // Since we're using the profile endpoint, we need to fetch from employee profile
    // and transform it to User format
    const response = await apiClient.get<any>("/employee/profile");
    const profileData = response.data;
    
    // Transform profile data to User format
    const userData: User = {
      employeeId: profileData.employeeId,
      email: profileData.email,
      role: profileData.role,
      token: '', // Token will be handled by cookie
    };
    
    return userData;
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

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post("/auth/change-password", data);
  },
};