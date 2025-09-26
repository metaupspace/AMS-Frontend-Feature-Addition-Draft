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
  requestEditAttendance: async(data : AttendanceEditRequest): Promise<AttendanceEditRequest |null>=>{
    console.log("Send Attendance Edit Request")
    if(!data.employeeId){
      console.log("No emloyee Id provided to send AttendanceRequest");
    }
    const  response = await apiClient.post<AttendanceEditRequest>("/employee/attendance-requests",data);
    console.log("Edit Request send with data", response.data);

    return response.data;
  },

 getAllEditAttendanceRequests: async (): Promise<AttendanceReviewRequest[] | null> => {
    console.log("Fetching all attendance edit requests (HR access)");
    
    try {
      // HR endpoint to get all attendance edit requests
      const response = await apiClient.get<AttendanceReviewRequest[]>("/hr/getall-requests");
      console.log("All edit requests response:", response.data);
      return response.data || [];
    } catch (error: any) {
      console.error("Error fetching all attendance edit requests:", error);
      
      // If it's a 404 or 400, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log("No edit requests found, returning empty array");
        return [];
      }
      
      throw error;
    }
  },

  reviewEditRequestAttendance: async (
    requestId: string,
    approved: boolean
  ): Promise<AttendanceEditRequest | null> => {
    console.log("review edit request");
    try {
      const response = await apiClient.put<AttendanceEditRequest>(
        `/hr/${requestId}/review`,
        {},
        { params: { approved } } 
      );
      console.log("Attendance reviewed", response.data);

      return response.data || null;
    } catch (error: any) {
      console.log("Error Reviewing request", error);
      return null;
    }
  }
  
};