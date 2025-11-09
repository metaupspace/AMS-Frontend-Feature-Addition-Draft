"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  LogIn,
  LogOut,
  MessageSquare,
  ExternalLink,
  MapPin,
  CheckSquare,
  XSquare,
  Timer,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { attendanceQueries } from "@/queries/attendance";
import { AttendanceRecord, AttendanceAgenda } from "@/models/attendance";
import { useAuth } from "@/app/context/AuthContext";

interface AttendanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: AttendanceRecord | null;
}

// Standard working hours per day (in minutes)
const STANDARD_WORKING_MINUTES = 10 * 60; // 10 hours = 600 minutes

const AttendanceDetailModal: React.FC<AttendanceDetailModalProps> = ({
  open,
  onOpenChange,
  attendance,
}) => {
  const [isClient, setIsClient] = useState(false);
  const { employee } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch agendas for the selected attendance
  const {
    data: agendas = [],
    isLoading: agendasLoading,
    error: agendasError,
  } = useQuery({
    queryKey: ["attendance-agendas", attendance?.id],
    queryFn: () => {
      if (!attendance?.id) return [];
      return attendanceQueries.getAttendanceAgendas(attendance.id);
    },
    enabled: open && Boolean(attendance?.id),
  });

  // Fetch all attendance records for the same day to calculate daily totals
  const {
    data: allAttendanceRecords = [],
  } = useQuery({
    queryKey: ["attendance-records", employee?.employeeId],
    queryFn: () => {
      if (!employee?.employeeId) return [];
      return attendanceQueries.getAttendanceRecords(employee.employeeId);
    },
    enabled: open && Boolean(employee?.employeeId),
  });

  const formatTime = (timeString?: string) => {
    if (!isClient || !timeString) return "N/A";

    try {
      const date = new Date(timeString);
      return format(date, "hh:mm a");
    } catch (error) {
      return "Invalid Time";
    }
  };

  const formatDate = (timeString?: string) => {
    if (!isClient || !timeString) return "N/A";

    try {
      const date = new Date(timeString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const parseLocation = (location?: string) => {
    if (!location || location === "NA") return null;
    const [lat, lng] = location.split(",");
    if (!lat || !lng) return null;
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  };

  const getGoogleMapsLink = (location?: string) => {
    const coords = parseLocation(location);
    if (!coords) return null;
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  };

  // Calculate daily totals for all slots on the same day
  const calculateDailyTotals = () => {
    if (!attendance?.checkInTime) return null;

    const attendanceDate = new Date(attendance.checkInTime);
    
    // Get all records from the same day
    const dailyRecords = allAttendanceRecords.filter((record) =>
      isSameDay(new Date(record.checkInTime), attendanceDate)
    );

    // Calculate total minutes worked for the day
    const totalMinutesWorkedForDay = dailyRecords.reduce(
      (sum, r) => sum + (r?.minutesWorked || 0),
      0
    );

    const overtimeMinutes = Math.max(0, totalMinutesWorkedForDay - STANDARD_WORKING_MINUTES);
    const lessMinutes = Math.max(0, STANDARD_WORKING_MINUTES - totalMinutesWorkedForDay);

    return {
      totalMinutes: totalMinutesWorkedForDay,
      standardMinutes: STANDARD_WORKING_MINUTES,
      overtimeMinutes,
      lessMinutes,
      numberOfSessions: dailyRecords.length,
    };
  };

  const dailyTotals = calculateDailyTotals();

  if (!attendance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1F6CB6]">
            <Clock className="h-5 w-5" />
            Attendance Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(attendance.checkInTime)}
              </p>
            </div>
            <div>
              {attendance.activeSession ? (
                <Badge className="bg-[#1F6CB6] text-white">
                  <Timer className="h-3 w-3 mr-1" />
                  Active Session
                </Badge>
              ) : attendance.checkOutTime ? (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-gray-50 text-gray-600 border-gray-200">
                  <XSquare className="h-3 w-3 mr-1" />
                  Incomplete
                </Badge>
              )}
            </div>
          </div>

          {/* Time Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <LogIn className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check In</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatTime(attendance.checkInTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check Out</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {attendance.checkOutTime
                        ? formatTime(attendance.checkOutTime)
                        : "Not checked out"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Working Hours Summary */}
          {dailyTotals && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#1F6CB6]" />
                Daily Working Hours Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Sessions */}
                <Card className="border-l-4 border-l-[#1F6CB6]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-[#1F6CB6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Sessions</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {dailyTotals.numberOfSessions}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Working Hours */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Timer className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Worked</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {formatDuration(dailyTotals.totalMinutes)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Standard Hours */}
                <Card className="border-l-4 border-l-gray-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <CheckSquare className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Standard</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {formatDuration(dailyTotals.standardMinutes)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overtime or Less Time */}
                {dailyTotals.overtimeMinutes > 0 && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overtime</p>
                          <p className="text-xl font-semibold text-green-600">
                            {formatDuration(dailyTotals.overtimeMinutes)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dailyTotals.lessMinutes > 0 && (
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg">
                          <TrendingDown className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Less Time</p>
                          <p className="text-xl font-semibold text-amber-600">
                            {formatDuration(dailyTotals.lessMinutes)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Current Session Duration */}
          {attendance.minutesWorked && attendance.minutesWorked > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Timer className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Session Duration</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatDuration(attendance.minutesWorked)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agendas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[#1F6CB6]" />
              Agendas
            </h3>
            {agendasLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#1F6CB6]" />
                <span className="ml-2 text-gray-600">Loading agendas...</span>
              </div>
            ) : agendasError ? (
              <Card className="border-red-200">
                <CardContent className="p-4 text-center text-red-600">
                  Failed to load agendas
                </CardContent>
              </Card>
            ) : agendas.length > 0 ? (
              <div className="space-y-2">
                {agendas.map((agenda: AttendanceAgenda) => (
                  <Card key={agenda.id} className="border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {agenda.complete ? (
                            <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <XSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                          <p
                            className={`text-sm ${
                              agenda.complete
                                ? "text-gray-900 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {agenda.title}
                          </p>
                        </div>
                        <Badge
                          className={
                            agenda.complete
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }
                        >
                          {agenda.complete ? "Completed" : "Incomplete"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gray-200">
                <CardContent className="p-4 text-center text-gray-600">
                  No agendas found
                </CardContent>
              </Card>
            )}
          </div>

          {/* Remark */}
          {attendance.remark && attendance.remark !== "" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Remark
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {attendance.remark}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reference Link */}
          {attendance.referenceLink &&
            attendance.referenceLink !== "" &&
            attendance.referenceLink.toLowerCase() !== "" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <ExternalLink className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Reference Link
                      </p>
                      <a
                        href={attendance.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 hover:underline break-all"
                      >
                        {attendance.referenceLink}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailModal;
