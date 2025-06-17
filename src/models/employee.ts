// models/employee.ts

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  contact: string;
  role: string;
  position: string | null;
  yearlySalary: number;
  address: string | null;
  passwordHash: string;
  active: boolean;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  contact: string;
  position?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}