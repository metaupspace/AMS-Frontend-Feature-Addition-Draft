// queries/hr.ts

import { apiClient } from "@/utils/api-client";
import { 
  HREmployee, 
  CreateEmployeeRequest, 
  CreateEmployeeResponse,
  MonthlyReportRequest,
  MonthlyReportResponse,
  EmployeeTimesheetParams,
  DailyActivityParams,
  DailyActivity
} from "@/models/hr";

export const hrQueries = {
  // Get all employees
  getEmployees: async (): Promise<HREmployee[]> => {
    const response = await apiClient.get<HREmployee[]>("/hr/employees");
    return response.data;
  },

  // Create new employee
  createEmployee: async (data: CreateEmployeeRequest): Promise<CreateEmployeeResponse> => {
    const response = await apiClient.post<CreateEmployeeResponse>("/hr/employee", data);
    return response.data;
  },

  // Deactivate employee
  deactivateEmployee: async (employeeId: string): Promise<void> => {
    await apiClient.post(`/hr/${employeeId}/deactivate`);
  },

  // Generate monthly report
  generateMonthlyReport: async (data: MonthlyReportRequest): Promise<MonthlyReportResponse> => {
    const response = await apiClient.post<MonthlyReportResponse>("/hr/reports/generate-monthly", data);
    return response.data;
  },

  // Download employee timesheet
  downloadEmployeeTimesheet: async (params: EmployeeTimesheetParams): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `/hr/reports/employee/${params.employeeId}/timesheet?year=${params.year}&month=${params.month}`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Get daily activity
  getDailyActivity: async (params: DailyActivityParams): Promise<DailyActivity[]> => {
    const response = await apiClient.get<DailyActivity[]>(`/hr/activity/daily?date=${params.date}`);
    return response.data;
  },
};