"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Timer,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { AttendanceRecord } from "@/models/attendance";
import {formatTime} from "@/utils/formatTime";
interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  currentSession: AttendanceRecord | null;
}

export function AttendanceCalendar({ 
  records, 
  isLoading, 
  currentSession 
}: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Get attendance record for selected date
  const getRecordForDate = (date: Date) => {
    return records.find(record => 
      isSameDay(new Date(record.checkInTime), date)
    );
  };

  // Get attendance record for selected date
  const selectedRecord = getRecordForDate(selectedDate);

  // Calculate month statistics
  const getMonthStats = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    
    const monthRecords = records.filter(record => {
      const recordDate = new Date(record.checkInTime);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    const totalDays = monthRecords.length;
    const completedDays = monthRecords.filter(r => r.checkOutTime && !r.activeSession).length;
    const activeDays = monthRecords.filter(r => r.activeSession).length;
    const totalHours = monthRecords.reduce((sum, r) => sum + (r.minutesWorked || 0), 0) / 60;

    return { totalDays, completedDays, activeDays, totalHours };
  };

  const monthStats = getMonthStats();


  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (record: AttendanceRecord) => {
    if (record.activeSession) return "bg-green-500";
    if (record.checkOutTime) return "bg-blue-500";
    return "bg-gray-400";
  };

  const getStatusText = (record: AttendanceRecord) => {
    if (record.activeSession) return "Active Session";
    if (record.checkOutTime) return "Completed";
    return "Incomplete";
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="font-medium min-w-[140px] text-center">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="rounded-md border"
              modifiers={{
                present: (date) => {
                  const record = getRecordForDate(date);
                  return !!record;
                },
                active: (date) => {
                  const record = getRecordForDate(date);
                  return record?.activeSession || false;
                },
                completed: (date) => {
                  const record = getRecordForDate(date);
                  return record?.checkOutTime && !record.activeSession || false;
                },
                incomplete: (date) => {
                  const record = getRecordForDate(date);
                  return record && !record.checkOutTime && !record.activeSession || false;
                },
              }}
              modifiersStyles={{
                present: { 
                  backgroundColor: '#dbeafe', 
                  color: '#1e40af',
                  fontWeight: '600'
                },
                active: { 
                  backgroundColor: '#dcfce7', 
                  color: '#166534',
                  fontWeight: '600'
                },
                completed: { 
                  backgroundColor: '#e0e7ff', 
                  color: '#3730a3',
                  fontWeight: '600'
                },
                incomplete: { 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e',
                  fontWeight: '600'
                },
              }}
              components={{
                DayContent: ({ date }) => {
                  const record = getRecordForDate(date);
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{format(date, "d")}</span>
                      {record && (
                        <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${getStatusColor(record)}`} />
                      )}
                    </div>
                  );
                }
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Active Session</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span>Incomplete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Month Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(calendarMonth, "MMMM")} Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Days</span>
              <Badge variant="outline">{monthStats.totalDays}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed</span>
              <Badge className="bg-blue-100 text-blue-800">{monthStats.completedDays}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <Badge className="bg-green-100 text-green-800">{monthStats.activeDays}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Hours</span>
              <Badge variant="outline">{monthStats.totalHours.toFixed(1)}h</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Daily</span>
              <Badge variant="outline">
                {monthStats.totalDays > 0 ? (monthStats.totalHours / monthStats.totalDays).toFixed(1) : 0}h
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "MMM dd, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRecord ? (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge 
                    className={
                      selectedRecord.activeSession 
                        ? "bg-green-100 text-green-800" 
                        : selectedRecord.checkOutTime 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedRecord.activeSession ? (
                      <Timer className="h-3 w-3 mr-1" />
                    ) : selectedRecord.checkOutTime ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {getStatusText(selectedRecord)}
                  </Badge>
                </div>

                {/* Check-in Time */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Check In</p>
                    <p className="text-sm text-green-600">
                      {formatTime(selectedRecord.checkInTime)}
                    </p>
                  </div>
                </div>

                {/* Check-out Time */}
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Check Out</p>
                    <p className="text-sm text-red-600">
                      {selectedRecord.checkOutTime 
                        ? formatTime(selectedRecord.checkOutTime)
                        : selectedRecord.activeSession 
                          ? "In progress"
                          : "Not checked out"
                      }
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-medium">
                    {formatDuration(selectedRecord.minutesWorked)}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Location</p>
                    <p className="text-sm text-blue-600 break-words">
                      {selectedRecord.checkInLocation}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                {(selectedRecord.remark || selectedRecord.referenceLink) && (
                  <div className="pt-3 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                    
                    {selectedRecord.remark && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">Remark:</p>
                        <p className="text-sm">{selectedRecord.remark}</p>
                      </div>
                    )}
                    
                    {selectedRecord.referenceLink && (
                      <div>
                        <p className="text-xs text-gray-600">Reference:</p>
                        <a 
                          href={selectedRecord.referenceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {selectedRecord.referenceLink}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  No attendance record for this date
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Quick Info */}
        {currentSession && isSameDay(new Date(currentSession.checkInTime), new Date()) && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">Today`s Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Currently Active</span>
                </div>
                <p className="text-sm text-green-700">
                  Started at {formatTime(currentSession.checkInTime)}
                </p>
                <p className="text-xs text-green-600">
                  Location: {currentSession.checkInLocation}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}