// models/auth.ts

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  employeeId: string;
  email: string;
}

export interface User {
  email: string;
  role: string;
  employeeId: string;
  token: string;
}

// Role types for the attendance system
export type UserRole = "HR" | "EMPLOYEE" | "ADMIN";

export interface UserPermission {
  route: string;
  access: string[];
}

export interface DecodedToken {
  sub: string; // email
  role: string;
  employeeId?: string;
  iat: number;
  exp: number;
}