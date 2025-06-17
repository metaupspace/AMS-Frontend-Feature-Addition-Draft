"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Mail,
  Plus,
  Calendar,
  BarChart3,
  RefreshCw,
  FileDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrQueries } from "@/queries/hr";
import { toast } from "@/hooks/use-toast";
import { HREmployee, EmployeeStats } from "@/models/hr";
import { CreateEmployeeModal } from "./document/CreateEmployeeModal";
import { MonthlyReportModal } from "./document/MonthlyReportModal";
import { TimesheetDownloadModal } from "./document/TimesheetDownloadModal";
import { DailyActivityCard } from "./document/DailyActivityCard";
import { EmployeeStatsCards } from "./document/EmployeeStatsCards";
import { EmployeeManagementTable } from "./document/EmployeeManagementTable";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch employees data
  const { 
    data: employees = [], 
    isLoading: employeesLoading,
    refetch: refetchEmployees 
  } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: hrQueries.getEmployees,
  });

  // Deactivate employee mutation
  const deactivateEmployeeMutation = useMutation({
    mutationFn: hrQueries.deactivateEmployee,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee has been deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate employee",
        variant: "destructive",
      });
      console.error("Deactivate employee error:", error);
    },
  });

  // Calculate employee statistics
  const employeeStats: EmployeeStats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(emp => emp.active).length,
    presentToday: employees.filter(emp => 
      emp.presentDates.includes(new Date().toISOString().split('T')[0])
    ).length,
    averageWorkingHours: employees.length > 0 
      ? employees.reduce((acc, emp) => acc + (emp.currentWeekMinutes / 60), 0) / employees.length 
      : 0,
  };

  // Helper function to format minutes to hours
  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to calculate attendance percentage
  const calculateAttendanceRate = (employee: HREmployee): number => {
    if (employee.totalWorkingDaysThisMonth === 0) return 0;
    return Math.round((employee.presentDaysThisMonth / employee.totalWorkingDaysThisMonth) * 100);
  };

  // Handle employee deactivation
  const handleDeactivateEmployee = (employeeId: string) => {
    deactivateEmployeeMutation.mutate(employeeId);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchEmployees();
    toast({
      title: "Refreshed",
      description: "Employee data has been updated",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600">Manage employees, reports, and attendance</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={employeesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${employeesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowTimesheetModal(true)}
            variant="outline"
            size="sm"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Download Timesheet
          </Button>
          
          <Button
            onClick={() => setShowReportModal(true)}
            variant="outline"
            size="sm"
          >
            <Mail className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Statistics Cards */}
      <EmployeeStatsCards 
        stats={employeeStats} 
        isLoading={employeesLoading} 
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
        
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performers This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees
                  .filter(emp => emp.active)
                  .sort((a, b) => calculateAttendanceRate(b) - calculateAttendanceRate(a))
                  .slice(0, 5)
                  .map((employee, index) => (
                    <div key={employee.employeeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.employeeId}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {calculateAttendanceRate(employee)}% attendance
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatMinutesToHours(employee.currentMonthMinutes)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Management Tab */}
        <TabsContent value="employees">
          <EmployeeManagementTable
            employees={employees}
            isLoading={employeesLoading}
            onDeactivateEmployee={handleDeactivateEmployee}
            isDeactivating={deactivateEmployeeMutation.isPending}
            formatMinutesToHours={formatMinutesToHours}
            calculateAttendanceRate={calculateAttendanceRate}
          />
        </TabsContent>

        {/* Daily Activity Tab */}
        <TabsContent value="activity">
          <DailyActivityCard />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateEmployeeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
        }}
      />

      <MonthlyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      <TimesheetDownloadModal
        isOpen={showTimesheetModal}
        onClose={() => setShowTimesheetModal(false)}
        employees={employees}
      />
    </div>
  );
}