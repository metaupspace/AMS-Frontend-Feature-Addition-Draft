// models/attendance.ts

export interface CheckInRequest {
  employeeId: string;
  agendas: string[];
  location: string;
}

export interface CheckOutRequest {
  employeeId: string;
  agendaCompletions: {
    agendaId: string;
    complete: boolean;
  }[];
  remark: string;
  referenceLink: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkInTime: string;
  checkOutTime: string | null;
  agendaIds: string[];
  remark: string | null;
  referenceLink: string | null;
  checkInLocation: string;
  activeSession: boolean;
  minutesWorked: number | null;
  editRequestStatus: string
}


// Request DTO for creating an edit request (employee side)
export interface AttendanceEditRequestDto {
  attendanceId: string;
  requestCheckIn: string; // ISO datetime string
  requestCheckOut: string; // ISO datetime string
  reason: string;
}

// Response from creating an edit request
export interface AttendanceEditRequest {
  id: string;
  employeeId: string;
  attendanceId: string;
  date: string;
  requestCheckIn: string;
  requestCheckOut: string;
  reason: string;
  status: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

// Detailed DTO for HR to view all request details
export interface AttendanceEditRequestDetailsDto {
  requestId: string;
  reason: string;
  status: string; // "PENDING", "APPROVED", "REJECTED"
  requestDate: string;
  
  // Employee info
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  
  // Original attendance info
  attendanceId: string;
  originalCheckIn: string | null;
  originalCheckOut: string | null;
  originalMinutesWorked: number | null;
  
  // Requested times
  requestCheckIn: string;
  requestCheckOut: string;
  
  // Review info
  reviewedByName?: string | null;
  reviewedAt?: string | null;
}

// Legacy interface for backward compatibility
export interface AttendanceReviewRequest extends AttendanceEditRequestDetailsDto {
  id: string;
  date: string;
  reviewedBy: string;
}

export interface AttendanceAgenda {
  id: string;
  title: string;
  complete: boolean;
  createdAt?: string;
}

export interface MonthlyAttendanceParams {
  employeeId: string;
  year: number;
  month: number;
}

export interface DailyAttendanceParams {
  employeeId: string;
  date: string; // YYYY-MM-DD format
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  totalHours: number;
  averageHours: number;
  attendanceRate: number;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendanceId: string;
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  totalMinutesWorked: number;
}