"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import EditAttendance from "./EditAttendance";
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
  Filter,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  LogIn,
  LogOut,
  Users,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { attendanceQueries } from "@/queries/attendance";
import { useAuth } from "@/app/context/AuthContext";

export default function ModernAttendancePage() {
  const { user, employee, isLoading: authLoading, isInitialized } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [dailyDetailModal, setDailyDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Wait for auth to be initialized before making queries
  const canMakeQueries = Boolean(
    isInitialized && !authLoading && user?.employeeId && employee?.employeeId
  );

  // Get all attendance records
  const {
    data: attendanceRecords = [],
    isLoading: recordsLoading,
    error: recordsError,
  } = useQuery({
    queryKey: ["attendance-records", employee?.employeeId],
    queryFn: () => {
      console.log(
        "Querying attendance records for employee:",
        employee?.employeeId
      );
      return attendanceQueries.getAttendanceRecords(employee!.employeeId);
    },
    enabled: canMakeQueries,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get monthly attendance
  const {} = useQuery({
    queryKey: [
      "monthly-attendance",
      employee?.employeeId,
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
    ],
    queryFn: () => {
      console.log(
        "Querying monthly attendance for employee:",
        employee?.employeeId
      );
      return attendanceQueries.getMonthlyAttendance({
        employeeId: employee!.employeeId,
        year: selectedMonth.getFullYear(),
        month: selectedMonth.getMonth() + 1,
      });
    },
    enabled: canMakeQueries,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const formatTime = (timeString) => {
    if (!isClient || !timeString) return "N/A";

    try {
      const date = new Date(timeString);
      return format(date, "hh:mm a");
    } catch (error) {
      return "Invalid Time" + error.message;
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

  // Get all sessions for a specific date
  const getDailyRecords = (date) => {
    return attendanceRecords
      .filter((record) => isSameDay(new Date(record.checkInTime), date))
      .sort(
        (a, b) =>
          new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime()
      );
  };

  const filteredRecords = attendanceRecords
    .filter((record) => {
      const matchesSearch =
        format(new Date(record.checkInTime), "MMM dd, yyyy")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (record.remark &&
          record.remark.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && record.activeSession) ||
        (statusFilter === "completed" &&
          record.checkOutTime &&
          !record.activeSession) ||
        (statusFilter === "incomplete" &&
          !record.checkOutTime &&
          !record.activeSession);

      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setDailyDetailModal(true);
  };

  const handleUpdate = async () => {
    //implemetation of handleUpdate function left
  };

  const handlDelete = async () =>{
    //implementaion of handleDelete is Lleft
  }

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

  const selectedDateRecords = selectedDate ? getDailyRecords(selectedDate) : [];

  return (
    <div className="min-h-screen bg-[#F7FCFE]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Error Display */}
        {recordsError && (
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-900">
                    Data Loading Error
                  </h4>
                  <p className="text-sm text-red-700">
                    Failed to load attendance records. Please try refreshing the
                    page.
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
                    present: (date) => {
                      const records = getDailyRecords(date);
                      return records.length > 0;
                    },
                    active: (date) => {
                      const records = getDailyRecords(date);
                      return records.some((record) => record.activeSession);
                    },
                    absent: (date) => {
                      const today = new Date();
                      const records = getDailyRecords(date);
                      return date < today && records.length === 0;
                    },
                  }}
                  modifiersStyles={{
                    present: {
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      fontWeight: "600",
                      borderRadius: "8px",
                    },
                    active: {
                      backgroundColor: "#1F6CB6",
                      color: "white",
                      fontWeight: "600",
                      borderRadius: "8px",
                    },
                    absent: {
                      backgroundColor: "#fecaca",
                      color: "#dc2626",
                      fontWeight: "600",
                      borderRadius: "8px",
                    },
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Date
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Check In
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Check Out
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Duration
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Remark
                    </TableHead>
                    <TableHead className="font-semibold text-[#1F6CB6]">
                      Edit
                    </TableHead>
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
                            {format(
                              new Date(record.checkInTime),
                              "MMM dd, yyyy"
                            )}
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
                          {record.checkOutTime
                            ? formatTime(record.checkOutTime)
                            : "N/A"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-gray-900">
                          {formatDuration(record.minutesWorked)}
                        </span>
                      </TableCell>

                      <TableCell>{getStatusBadge(record)}</TableCell>

                      <TableCell>
                        <span className="text-sm text-gray-600 max-w-[150px] truncate block">
                          {record.remark || "No remark"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 max-w-[150px] truncate block">
                          <EditAttendance
                            record={record}
                            onUpdate={handleUpdate}
                            onDelete={handlDelete}
                          />
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
                    : "No attendance records found."}
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
                  Showing {filteredRecords.length} of {attendanceRecords.length}{" "}
                  records
                </p>
                <p className="text-sm text-gray-600">
                  Total hours:{" "}
                  {(
                    filteredRecords.reduce(
                      (sum, r) => sum + (r.minutesWorked || 0),
                      0
                    ) / 60
                  ).toFixed(1)}
                  h
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Daily Detail Modal */}
        <Dialog open={dailyDetailModal} onOpenChange={setDailyDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-[#1F6CB6]">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {selectedDate && format(selectedDate, "MMM dd, yyyy")} - Daily
                  Details
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>
                    {selectedDateRecords.length} session
                    {selectedDateRecords.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {selectedDateRecords.length > 0 ? (
                <>
                  {/* Day Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-[#1F6CB6]">
                          {selectedDateRecords.length}
                        </div>
                        <div className="text-sm text-gray-600">Sessions</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {
                            selectedDateRecords.filter((r) => r.checkOutTime)
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Individual Sessions */}
                  <div className="space-y-4">
                    {selectedDateRecords.map((session, index) => (
                      <Card
                        key={session.id}
                        className="border-l-4 border-l-[#1F6CB6]"
                      >
                        <CardContent className="p-6">
                          {/* Session Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">
                              Session {index + 1}
                            </h3>
                            <div className="flex items-center gap-2">
                              {session.minutesWorked > 0 && (
                                <span className="text-sm text-gray-600">
                                  {formatDuration(session.minutesWorked)}
                                </span>
                              )}
                              {getStatusBadge(session)}
                            </div>
                          </div>

                          {/* Time Details */}
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <LogIn className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  Check In
                                </p>
                                <p className="text-lg font-semibold text-green-900">
                                  {formatTime(session.checkInTime)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                              <LogOut className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  Check Out
                                </p>
                                <p className="text-lg font-semibold text-red-900">
                                  {session.checkOutTime
                                    ? formatTime(session.checkOutTime)
                                    : "Not checked out"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Agendas
                          {session.agendaIds && session.agendaIds.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Agendas</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">
                                    {session.agendaIds.length} task{session.agendaIds.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {session.agendaIds.map((agendaId, agendaIndex) => (
                                  <div key={agendaId} className="flex items-center gap-1 p-2 ">
                                    <span className="text-sm flex-1 text-gray-900">
                                      Agenda {agendaIndex + 1} - {agendaId}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )} */}

                          {/* Additional Info */}
                          <div className="grid md:grid-cols-2 gap-4">
                            {session.remark && (
                              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">
                                    Remark
                                  </p>
                                  <p className="text-sm text-blue-600 whitespace-pre-wrap">
                                    {session.remark}
                                  </p>
                                </div>
                              </div>
                            )}

                            {session.referenceLink &&
                              session.referenceLink !== "na" && (
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                  <ExternalLink className="h-5 w-5 text-purple-600" />
                                  <div>
                                    <p className="text-sm font-medium text-purple-800">
                                      Reference
                                    </p>
                                    <a
                                      href={session.referenceLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-purple-600 hover:underline break-all"
                                    >
                                      View Link
                                    </a>
                                  </div>
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
