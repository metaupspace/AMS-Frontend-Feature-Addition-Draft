"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  Search,
  Download,
  Filter,
  AlertCircle
} from "lucide-react";
import { format,isSameDay } from "date-fns";
import { attendanceQueries } from "@/queries/attendance";
import { useAuth } from "@/app/context/AuthContext";

export default function ModernAttendancePage() {
  const { user, employee, isLoading: authLoading, isInitialized } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [dailyDetailModal, setDailyDetailModal] = useState(false);
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Wait for auth to be initialized before making queries
  const canMakeQueries = Boolean(isInitialized && !authLoading && user?.employeeId && employee?.employeeId);



  // Get all attendance records
  const {
    data: attendanceRecords = [],
    isLoading: recordsLoading,
    error: recordsError,
  } = useQuery({
    queryKey: ["attendance-records", employee?.employeeId],
    queryFn: () => {
      console.log("Querying attendance records for employee:", employee?.employeeId);
      return attendanceQueries.getAttendanceRecords(employee!.employeeId);
    },
    enabled: canMakeQueries,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Get monthly attendance
  const {
    data: monthlyRecords = [],
  } = useQuery({
    queryKey: ["monthly-attendance", employee?.employeeId, selectedMonth.getFullYear(), selectedMonth.getMonth() + 1],
    queryFn: () => {
      console.log("Querying monthly attendance for employee:", employee?.employeeId);
      return attendanceQueries.getMonthlyAttendance({
        employeeId: employee!.employeeId,
        year: selectedMonth.getFullYear(),
        month: selectedMonth.getMonth() + 1,
      });
    },
    enabled: canMakeQueries,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const formatTime = (timeString) => {
    if (!isClient || !timeString) return 'N/A';
    
    try {
      const date = new Date(timeString);
      return format(date, "hh:mm a");
    } catch (error) {
      return 'Invalid Time' + error.message;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };




  const getStatusBadge = (record) => {
    if (record.activeSession) {
      return (
        <Badge className="bg-[#1F6CB6] text-white border-[#1F6CB6] hover:bg-[#1A5A9E] transition-colors duration-200">
          <Timer className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (record.checkOutTime) {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors duration-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition-colors duration-200">
        <XCircle className="h-3 w-3 mr-1" />
        Incomplete
      </Badge>
    );
  };

  const getDailyRecord = (date) => {
    return attendanceRecords.find(record => 
      isSameDay(new Date(record.checkInTime), date)
    );
  };

  const filteredRecords = attendanceRecords
    .filter((record) => {
      const matchesSearch = 
        format(new Date(record.checkInTime), "MMM dd, yyyy").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.remark && record.remark.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && record.activeSession) ||
        (statusFilter === "completed" && record.checkOutTime && !record.activeSession) ||
        (statusFilter === "incomplete" && !record.checkOutTime && !record.activeSession);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  const handleDateClick = (date) => {
    const record = getDailyRecord(date);
    setSelectedDate(date);
    setSelectedDayRecord(record);
    setDailyDetailModal(true);
  };

 

  const exportToCSV = () => {
    const headers = ["Date", "Check In", "Check Out", "Duration", "Status", "Remark"];
    const csvData = filteredRecords.map(record => [
      format(new Date(record.checkInTime), "yyyy-MM-dd"),
      formatTime(record.checkInTime),
      record.checkOutTime ? formatTime(record.checkOutTime) : "N/A",
      formatDuration(record.minutesWorked),
      record.activeSession ? "Active" : (record.checkOutTime ? "Completed" : "Incomplete"),
      record.remark || "No remark"
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Show loading state while auth is initializing or client is not ready
  if (!isClient || !isInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F7FCFE]">
        <div className="flex items-center gap-2">
          <Timer className="h-6 w-6 animate-spin text-[#1F6CB6]" />
          <span>Loading authentication...</span>
        </div>
      </div>
    );
  }

  // Show error if user or employee data is missing
  if (!user || !employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F7FCFE]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load employee profile. Please try logging in again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (recordsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#F7FCFE]">
        <div className="flex items-center gap-2">
          <Timer className="h-6 w-6 animate-spin text-[#1F6CB6]" />
          <span>Loading attendance records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FCFE]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
       

        {/* Error Display */}
        {(recordsError ) && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-900">Data Loading Error</h4>
                  <p className="text-sm text-red-700">
                    {recordsError ? "Failed to load attendance records. " : ""}
                    {/* {monthlyError ? "Failed to load monthly records. " : ""} */}
                    Please try refreshing the page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

       

        {/* Calendar Section - Top */}
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1F6CB6]">
              <CalendarDays className="h-5 w-5" />
              Monthly Attendance - {format(selectedMonth, "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <div className="w-full max-w-lg">
                <Calendar
                  mode="single"
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  className="w-full border-0"
                  onDayClick={handleDateClick}
                  modifiers={{
                    present: (date) => monthlyRecords.some(record => {
                      return isSameDay(new Date(record.checkInTime), date);
                    }),
                    active: (date) => monthlyRecords.some(record => {
                      return isSameDay(new Date(record.checkInTime), date) && record.activeSession;
                    }),
                    absent: (date) => {
                      const today = new Date();
                      const hasRecord = monthlyRecords.some(record => 
                        isSameDay(new Date(record.checkInTime), date)
                      );
                      return date < today && !hasRecord;
                    }
                  }}
                  modifiersStyles={{
                    present: { 
                      backgroundColor: '#dcfce7', 
                      color: '#166534',
                      fontWeight: '600',
                      borderRadius: '8px'
                    },
                    active: { 
                      backgroundColor: '#1F6CB6', 
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '8px'
                    },
                    absent: {
                      backgroundColor: '#fecaca',
                      color: '#dc2626',
                      fontWeight: '600',
                      borderRadius: '8px'
                    }
                  }}
                  classNames={{
                    table: "w-full",
                    head_cell: "text-gray-600 font-medium p-2",
                    cell: "p-1",
                    day: "h-10 w-10 text-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer",
                    day_today: "bg-[#1F6CB6] text-white font-bold",
                  }}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#1F6CB6] rounded"></div>
                  <span>Active Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#1F6CB6] rounded ring-2 ring-white ring-offset-2"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History Table - Bottom */}
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2 text-[#1F6CB6]">
                <Clock className="h-5 w-5" />
                Attendance History
              </CardTitle>
              
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={filteredRecords.length === 0}
                className="border-[#1F6CB6] text-[#1F6CB6] hover:bg-[#1F6CB6] hover:text-white transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by date or remark..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#1F6CB6] transition-colors duration-200"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-gray-200 focus:border-[#1F6CB6] transition-colors duration-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F7FCFE]">
                    <TableHead className="font-semibold text-[#1F6CB6]">Date</TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">Check In</TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">Check Out</TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">Duration</TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">Status</TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow 
                      key={record.id}
                      className="hover:bg-[#F7FCFE] transition-colors border-b border-gray-100"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {format(new Date(record.checkInTime), "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(record.checkInTime), "EEEE")}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {formatTime(record.checkInTime)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {record.checkOutTime ? formatTime(record.checkOutTime) : "N/A"}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {formatDuration(record.minutesWorked)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(record)}
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-gray-600 max-w-[150px] truncate block">
                          {record.remark || "No remark"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRecords.length === 0 && !recordsLoading && (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No Records Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "No attendance records match your current filters."
                    : "No attendance records found."
                  }
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    variant="outline"
                    className="mt-4 border-[#1F6CB6] text-[#1F6CB6] hover:bg-[#1F6CB6] hover:text-white transition-colors duration-200"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {filteredRecords.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredRecords.length} of {attendanceRecords.length} records
                </p>
                <p className="text-sm text-gray-600">
                  Total hours: {(filteredRecords.reduce((sum, r) => sum + (r.minutesWorked || 0), 0) / 60).toFixed(1)}h
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Detail Modal */}
        <Dialog open={dailyDetailModal} onOpenChange={setDailyDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-[#1F6CB6]">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {selectedDate && format(selectedDate, "MMM dd, yyyy")}
                </span>
              
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedDayRecord ? (
                <>
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    {getStatusBadge(selectedDayRecord)}
                  </div>

                  {/* Time Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Check In</p>
                        <p className="text-lg font-semibold text-green-900">
                          {formatTime(selectedDayRecord.checkInTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Check Out</p>
                        <p className="text-lg font-semibold text-red-900">
                          {selectedDayRecord.checkOutTime ? formatTime(selectedDayRecord.checkOutTime) : "Not checked out"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-[#F7FCFE] rounded-lg border border-[#1F6CB6]/20">
                      <Timer className="h-6 w-6 text-[#1F6CB6]" />
                      <div>
                        <p className="text-sm font-medium text-[#1F6CB6]">Duration</p>
                        <p className="text-lg font-semibold text-[#1F6CB6]">
                          {formatDuration(selectedDayRecord.minutesWorked)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remark */}
                  {selectedDayRecord.remark && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Remark</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDayRecord.remark}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Attendance Record
                  </h3>
                  <p className="text-gray-600">
                    No attendance found for this date
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}