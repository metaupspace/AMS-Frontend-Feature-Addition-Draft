// queries/employee.ts

import { apiClient } from "@/utils/api-client";
import { 
  EmployeeProfile, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  ChangePasswordResponse 
} from "@/models/employee";

export const employeeQueries = {
  // Get employee profile
  getProfile: async (): Promise<EmployeeProfile> => {
    const response = await apiClient.get<EmployeeProfile>("/employee/profile");
    return response.data;
  },

  // Update employee profile
  updateProfile: async (data: UpdateProfileRequest): Promise<EmployeeProfile> => {
    const response = await apiClient.post<EmployeeProfile>("/employee/profile", data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await apiClient.post<ChangePasswordResponse>("/employee/change-password", data);
    return response.data;
  },
};