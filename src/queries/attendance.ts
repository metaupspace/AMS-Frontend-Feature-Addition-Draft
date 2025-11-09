// queries/attendance.ts

import { apiClient } from "@/utils/api-client";
import { 
  CheckInRequest,
  CheckOutRequest,
  CheckInResponse,
  CheckOutResponse,
  AttendanceRecord,
  AttendanceAgenda,
  MonthlyAttendanceParams,
  DailyAttendanceParams,
  AttendanceEditRequest,
  AttendanceEditRequestDto,
  AttendanceEditRequestDetailsDto,
  AttendanceReviewRequest
} from "@/models/attendance";

// New interface for active session response
interface ActiveSessionResponse {
  attendance: AttendanceRecord | null;
  agendas: AttendanceAgenda[];
}

export const attendanceQueries = {
  // Check in
  checkIn: async (data: CheckInRequest): Promise<CheckInResponse> => {
    console.log("Check-in request data:", data); // Debug log
    
    if (!data.employeeId) {
      throw new Error("Employee ID is required for check-in");
    }
    
    const response = await apiClient.post<CheckInResponse>("/attendance/check-in", data);
    console.log("Check-in response:", response.data); // Debug log
    return response.data;
  },

  // Check out
  checkOut: async (data: CheckOutRequest): Promise<CheckOutResponse> => {
    console.log("Check-out request data:", data); // Debug log
    
    if (!data.employeeId) {
      throw new Error("Employee ID is required for check-out");
    }
    
    const response = await apiClient.post<CheckOutResponse>("/attendance/check-out", data);
    console.log("Check-out response:", response.data); // Debug log
    return response.data;
  },

  // Get attendance records for employee
  getAttendanceRecords: async (employeeId: string): Promise<AttendanceRecord[]> => {
    console.log("Fetching attendance records for employee:", employeeId); // Debug log
    
    if (!employeeId || employeeId.trim() === "") {
      console.error("No valid employee ID provided for getAttendanceRecords");
      throw new Error("Employee ID is required to fetch attendance records");
    }
    
    try {
      // Updated endpoint to match your API structure
      const response = await apiClient.get<AttendanceRecord[]>(`/attendance/${employeeId}/records`);
      console.log("Attendance records response:", response.data); // Debug log
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching attendance records:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No attendance records found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },

  // Get agendas for specific attendance record
  getAttendanceAgendas: async (attendanceId: string): Promise<AttendanceAgenda[]> => {
    console.log("Fetching agendas for attendance:", attendanceId); // Debug log
    
    if (!attendanceId) {
      throw new Error("Attendance ID is required to fetch agendas");
    }
    
    try {
      const response = await apiClient.get<AttendanceAgenda[]>(`/attendance/${attendanceId}/agendas`);
      console.log("Attendance agendas response:", response.data); // Debug log
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching attendance agendas:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No agendas found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },

  // Get monthly attendance
  getMonthlyAttendance: async (params: MonthlyAttendanceParams): Promise<AttendanceRecord[]> => {
    console.log("Fetching monthly attendance:", params); // Debug log
    
    if (!params.employeeId || params.employeeId.trim() === "") {
      throw new Error("Employee ID is required for monthly attendance");
    }
    
    try {
      const response = await apiClient.get<AttendanceRecord[]>(
        `/attendance/monthly/${params.employeeId}?year=${params.year}&month=${params.month}`
      );
      console.log("Monthly attendance response:", response.data); // Debug log
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching monthly attendance:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No monthly attendance found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },

  // Get daily attendance
  getDailyAttendance: async (params: DailyAttendanceParams): Promise<AttendanceRecord | null> => {
    console.log("Fetching daily attendance:", params); // Debug log
    
    if (!params.employeeId || params.employeeId.trim() === "") {
      throw new Error("Employee ID is required for daily attendance");
    }
    
    try {
      const response = await apiClient.get<AttendanceRecord>(
        `/attendance/daily/${params.employeeId}?date=${params.date}`
      );
      console.log("Daily attendance response:", response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error("Error fetching daily attendance:", error);
      
      // Return null if no attendance found for the day (404 or 400)
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No daily attendance found, returning null");
        return null;
      }
      
      throw error;
    }
  },

  // Get current active session - Updated to handle both 404 and 400 errors
  getCurrentSession: async (employeeId: string): Promise<AttendanceRecord | null> => {
    console.log("Fetching current session for employee:", employeeId); // Debug log
    
    if (!employeeId || employeeId.trim() === "") {
      console.error("No valid employee ID provided for getCurrentSession");
      return null;
    }
    
    try {
      // Use the correct endpoint: /api/attendance/{empid}/active
      const response = await apiClient.get<ActiveSessionResponse>(
        `/attendance/${employeeId}/active`
      );
      console.log("Current session response:", response.data); // Debug log
      
      // Return the attendance part of the response
      return response.data?.attendance || null;
    } catch (error: any) {
      console.error("Error fetching current session:", error);
      
      // Handle both 404 and 400 errors as "no active session"
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No active session found (status:", error.response?.status, "), returning null");
        return null;
      }
      
      throw error;
    }
  },

  // Get current active session with agendas - Updated to handle both 404 and 400 errors
  getActiveSessionWithAgendas: async (employeeId: string): Promise<ActiveSessionResponse | null> => {
    console.log("Fetching active session with agendas for employee:", employeeId); // Debug log
    
    if (!employeeId || employeeId.trim() === "") {
      console.error("No valid employee ID provided for getActiveSessionWithAgendas");
      return null;
    }
    
    try {
      // Use the correct endpoint: /api/attendance/{empid}/active
      const response = await apiClient.get<ActiveSessionResponse>(
        `/attendance/${employeeId}/active`
      );
      console.log("Active session with agendas response:", response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error("Error fetching active session with agendas:", error);
      
      // Handle both 404 and 400 errors as "no active session"
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No active session found (status:", error.response?.status, "), returning null");
        return null;
      }
      
      throw error;
    }
  },

  // Get today's attendance specifically
  getTodayAttendance: async (employeeId: string): Promise<AttendanceRecord | null> => {
    console.log("Fetching today's attendance for employee:", employeeId); // Debug log
    
    if (!employeeId) {
      console.error("No employee ID provided for getTodayAttendance");
      return null;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return await attendanceQueries.getDailyAttendance({ employeeId, date: today });
  },
  
  // Employee creates an attendance edit request
  requestEditAttendance: async(data: AttendanceEditRequestDto): Promise<AttendanceEditRequest | null> => {
    console.log("Sending Attendance Edit Request:", data);
    
    try {
      const response = await apiClient.post<AttendanceEditRequest>(
        "/employee/attendance/edit-request",
        data
      );
      console.log("Edit Request created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating edit request:", error);
      // Try to surface Spring validation errors clearly (e.g. @PastOrPresent)
      const resp = error?.response;
      const data = resp?.data;

      // If backend sent a string body, check for specific validation errors
      if (typeof data === "string" && data.trim()) {
        // Check if it's a future time validation error
        if (data.includes("PastOrPresent") || data.includes("cannot be in the future")) {
          throw new Error("Edit request can't be in future");
        }
        
        // For other errors, try to extract the default message
        const allMatches = data.match(/default message\[([^\]]+)\]/g);
        if (allMatches && allMatches.length > 0) {
          // Get the last match and extract the content
          const lastMatch = allMatches[allMatches.length - 1];
          const messageContent = lastMatch.match(/default message\[([^\]]+)\]/);
          if (messageContent && messageContent[1]) {
            throw new Error(messageContent[1]);
          }
        }
        // If no match, throw the entire string
        throw new Error(data);
      }

      // Prefer field-level defaultMessage from standard Spring Boot error payload
      // Shapes commonly seen:
      // { message: "Validation failed ...", errors: [{ field, defaultMessage, ... }] }
      // or { fieldErrors: [{ field, defaultMessage, ... }], message: "..." }
      const fromErrorsArray = Array.isArray(data?.errors) && data.errors.length
        ? (data.errors[0].defaultMessage || data.errors[0].message)
        : undefined;

      const fromFieldErrors = Array.isArray(data?.fieldErrors) && data.fieldErrors.length
        ? (data.fieldErrors[0].defaultMessage || data.fieldErrors[0].message)
        : undefined;

      const fallbackMessage = data?.message || resp?.statusText || "Failed to submit edit request";

      const picked = fromErrorsArray || fromFieldErrors || fallbackMessage;

      // Optionally include which field failed if available
      const fieldName = (Array.isArray(data?.errors) && data.errors[0]?.field)
        || (Array.isArray(data?.fieldErrors) && data.fieldErrors[0]?.field)
        || undefined;

      const finalMessage = fieldName && picked
        ? `${picked}`
        : picked;

      throw new Error(finalMessage);
    }
  },

  // HR fetches all pending attendance edit requests
  getAllEditAttendanceRequests: async (): Promise<AttendanceEditRequestDetailsDto[]> => {
    console.log("Fetching all pending attendance edit requests (HR access)");
    
    try {
      const response = await apiClient.get<AttendanceEditRequestDetailsDto[]>(
        "/hr/attendance/edit-requests/pending"
      );
      console.log("Pending edit requests response:", response.data);
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching pending edit requests:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No pending requests found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },

  // HR approves an attendance edit request
  approveEditRequest: async (requestId: string): Promise<AttendanceEditRequest> => {
    console.log("Approving edit request:", requestId);
    
    try {
      const response = await apiClient.post<AttendanceEditRequest>(
        `/hr/attendance/edit-requests/${requestId}/approve`
      );
      console.log("Request approved successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error approving request:", error);
      throw error;
    }
  },

  // HR rejects an attendance edit request
  rejectEditRequest: async (requestId: string): Promise<AttendanceEditRequest> => {
    console.log("Rejecting edit request:", requestId);
    
    try {
      const response = await apiClient.post<AttendanceEditRequest>(
        `/hr/attendance/edit-requests/${requestId}/reject`
      );
      console.log("Request rejected successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      throw error;
    }
  },

  // Employee fetches their own attendance edit requests
  getMyEditRequests: async (): Promise<AttendanceEditRequestDetailsDto[]> => {
    console.log("Fetching my attendance edit requests");
    
    try {
      const response = await apiClient.get<AttendanceEditRequestDetailsDto[]>(
        `/employee/attendance/edit-requests`
      );
      console.log("My edit requests fetched:", response.data);
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching my edit requests:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No edit requests found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },


  
};