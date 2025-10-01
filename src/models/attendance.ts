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


export interface AttendanceEditRequest{
  employeeId: string,
  attendanceId: string,
  date: string,
  requestCheckIn: string,
  requestCheckOut:string,
  reason:string
  status:string
}

export interface AttendanceReviewRequest{
  id: string,
  employeeId: string,
  attendanceId: string,
  date: string,
  requestCheckIn: string,
  requestCheckOut:string,
  reason:string,
  reviewedBy: string,
  reviewedAt: string,
  status: string
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