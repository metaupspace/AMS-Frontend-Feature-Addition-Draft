// models/hr.ts

export interface HREmployee {
  employeeId: string;
  name: string;
  email: string;
  contact: string;
  role: string;
  active: boolean;
  currentWeekMinutes: number;
  currentMonthMinutes: number;
  presentDaysThisMonth: number;
  totalWorkingDaysThisMonth: number;
  presentDates: string[];
  position?: string;
  yearlySalary?: number;
  address?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  contact: string;
  role: string;
  position: string;
  yearlySalary: number;
  address: string;
  password: string;
}

export interface CreateEmployeeResponse {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  contact: string;
  role: string;
  position: string;
  yearlySalary: number;
  address: string;
  passwordHash: string;
  active: boolean;
}

export interface MonthlyReportRequest {
  year: number;
  month: number;
}

export interface MonthlyReportResponse {
  yearMonth: string;
  message: string;
}

export interface EmployeeTimesheetParams {
  employeeId: string;
  year: number;
  month: number;
}

export interface DailyActivityParams {
  date: string; // Format: YYYY-MM-DD
}

export interface DailyActivity {
  employeeId: string;
  employeeName: string;
  checkInTime: string;
  checkOutTime: string | null;
  totalMinutesWorked: number | null;
  agendas: {
    id: string;
    title: string;
    complete: boolean;
  }[];
  remark: string | null;
  referenceLink: string | null;
  activeSession: boolean;
  checkInLocation: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  averageWorkingHours: number;
}

export interface AttendanceMetrics {
  weeklyHours: number;
  monthlyHours: number;
  attendanceRate: number;
  totalWorkingDays: number;
}