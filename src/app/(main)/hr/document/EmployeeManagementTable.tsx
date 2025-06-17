"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  UserX, 
  Search, 
  Filter,
  Users,
} from "lucide-react";
import { HREmployee } from "@/models/hr";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

interface EmployeeManagementTableProps {
  employees: HREmployee[];
  isLoading: boolean;
  onDeactivateEmployee: (employeeId: string) => void;
  isDeactivating: boolean;
  formatMinutesToHours: (minutes: number) => string;
  calculateAttendanceRate: (employee: HREmployee) => number;
}

export function EmployeeManagementTable({
  employees,
  isLoading,
  onDeactivateEmployee,
  isDeactivating,
  formatMinutesToHours,
  calculateAttendanceRate,
}: EmployeeManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && employee.active) ||
      (statusFilter === "inactive" && !employee.active);
    
    const matchesRole = 
      roleFilter === "all" || employee.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Get unique roles for filter
  const uniqueRoles = [...new Set(employees.map(emp => emp.role))];

  const handleDeactivateClick = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = () => {
    if (selectedEmployee) {
      onDeactivateEmployee(selectedEmployee);
    }
    setShowDeactivateModal(false);
    setSelectedEmployee(null);
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Inactive
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      HR: "bg-purple-100 text-purple-800",
      EMPLOYEE: "bg-blue-100 text-blue-800",
      ADMIN: "bg-orange-100 text-orange-800",
    };
    
    return (
      <Badge 
        variant="outline" 
        className={colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"}
      >
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Management ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Status: {statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Role: {roleFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>
                    All Roles
                  </DropdownMenuItem>
                  {uniqueRoles.map((role) => (
                    <DropdownMenuItem 
                      key={role} 
                      onClick={() => setRoleFilter(role)}
                    >
                      {role}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>This Month</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow 
                    key={employee.employeeId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-gray-600">{employee.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm">{employee.email}</p>
                        <p className="text-sm text-gray-600">{employee.contact}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getRoleBadge(employee.role)}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(employee.active)}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {formatMinutesToHours(employee.currentMonthMinutes)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Week: {formatMinutesToHours(employee.currentWeekMinutes)}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {calculateAttendanceRate(employee)}%
                        </p>
                        <p className="text-xs text-gray-600">
                          {employee.presentDaysThisMonth}/{employee.totalWorkingDaysThisMonth} days
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {employee.active && (
                            <DropdownMenuItem
                              onClick={() => handleDeactivateClick(employee.employeeId)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employees found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Employee"
        description={`Are you sure you want to deactivate this employee? They will no longer be able to access the system.`}
        confirmText="Deactivate"
        isLoading={isDeactivating}
        variant="destructive"
      />
    </>
  );
}