"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {formatTime} from "@/utils/formatTime";
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  Circle,
  ExternalLink,
  MessageSquare,
  Timer,
  LogIn,
  LogOut
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/utils/regex";
import { hrQueries } from "@/queries/hr";
import { DailyActivity } from "@/models/hr";

export function DailyActivityCard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: dailyActivities = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["daily-activity", format(selectedDate, "yyyy-MM-dd")],
    queryFn: () =>
      hrQueries.getDailyActivity({
        date: format(selectedDate, "yyyy-MM-dd"),
      }),
  });

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Group activities by employee to handle multiple sessions
  const groupedActivities = dailyActivities.reduce((acc, activity) => {
    const key = activity.employeeId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, DailyActivity[]>);

  // Calculate summary statistics
  const uniqueEmployees = Object.keys(groupedActivities).length;
  const hasActiveSession = (sessions: DailyActivity[]) => 
    sessions.some(session => session.activeSession);
  const activeEmployees = Object.values(groupedActivities)
    .filter(sessions => hasActiveSession(sessions)).length;
  
  const hasCompletedCheckout = (sessions: DailyActivity[]) =>
    sessions.some(session => session.checkOutTime !== null);
  const completedCheckouts = Object.values(groupedActivities)
    .filter(sessions => hasCompletedCheckout(sessions)).length;
  
  const totalMinutesWorked = dailyActivities.reduce((sum, activity) => 
    sum + (activity.totalMinutesWorked || 0), 0
  );

  // Helper function to format minutes to hours
  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to calculate completion percentage for agendas
  const getAgendaCompletion = (agendas: DailyActivity['agendas']) => {
    if (!agendas || agendas.length === 0) return 0;
    const completed = agendas.filter(agenda => agenda.complete).length;
    return Math.round((completed / agendas.length) * 100);
  };

  // Helper function to get employee status
  const getEmployeeStatus = (
    sessions: DailyActivity[]
  ): { status: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string } => {
    const hasActive = sessions.some(session => session.activeSession);
    if (hasActive) return { status: "Active", variant: "default", className: "bg-green-100 text-green-800" };
    
    const hasCompleted = sessions.some(session => session.checkOutTime !== null);
    if (hasCompleted) return { status: "Completed", variant: "secondary", className: "bg-gray-100 text-gray-800" };
    
    return { status: "Incomplete", variant: "destructive", className: "bg-red-100 text-red-800" };
  };

  // Helper function to get total minutes for an employee
  const getEmployeeTotalMinutes = (sessions: DailyActivity[]) => {
    return sessions.reduce((sum, session) => sum + (session.totalMinutesWorked || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Daily Activity
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading || isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? "..." : uniqueEmployees}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : activeEmployees}
                </p>
              </div>
              <Timer className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? "..." : completedCheckouts}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? "..." : formatMinutesToHours(totalMinutesWorked)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Activity Details ({uniqueEmployees} employees, {dailyActivities.length} sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="p-6 border rounded-lg animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedActivities).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([employeeId, sessions]) => {
                const firstSession = sessions[0];
                const employeeStatus = getEmployeeStatus(sessions);
                const totalMinutes = getEmployeeTotalMinutes(sessions);
                
                return (
                  <Card key={employeeId} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      {/* Employee Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {firstSession.employeeName.charAt(0).toUpperCase()}
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-lg">{firstSession.employeeName}</h3>
                            <p className="text-sm text-gray-600">{employeeId}</p>
                            <p className="text-xs text-gray-500">{sessions.length} session{sessions.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge 
                            variant={employeeStatus.variant}
                            className={employeeStatus.className}
                          >
                            {employeeStatus.status}
                          </Badge>
                          {totalMinutes > 0 && (
                            <p className="text-sm font-medium mt-1">
                              Total: {formatMinutesToHours(totalMinutes)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Sessions Details */}
                      <div className="space-y-4">
                        {sessions.map((session, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Session {index + 1}</h4>
                              <div className="flex items-center gap-2">
                                {session.totalMinutesWorked !== null && session.totalMinutesWorked > 0 && (
                                  <span className="text-xs text-gray-600">
                                    {formatMinutesToHours(session.totalMinutesWorked)}
                                  </span>
                                )}
                                <Badge 
                                  variant={session.activeSession ? "default" : "secondary"}
                                  className={session.activeSession ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {session.activeSession ? "Active" : "Ended"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                                <LogIn className="h-4 w-4 text-green-600" />
                                <div>
                                  <p className="text-xs font-medium text-green-800">Check In</p>
                                  <p className="text-sm text-green-600">{formatTime(session.checkInTime)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                                <LogOut className="h-4 w-4 text-red-600" />
                                <div>
                                  <p className="text-xs font-medium text-red-800">Check Out</p>
                                  <p className="text-sm text-red-600">
                                    {session.checkOutTime ? formatTime(session.checkOutTime) : "Not checked out"}
                                  </p>
                                </div>
                              </div>
                            </div>

                           

                            

                            {(session.remark || session.referenceLink) && (
                              <div className="grid md:grid-cols-2 gap-2 mt-3">
                                {session.remark && (
                                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                                    <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-medium text-blue-800">Remark</p>
                                      <p className="text-sm text-blue-600">{session.remark}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {session.referenceLink && session.referenceLink !== "na" && (
                                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                                    <ExternalLink className="h-4 w-4 text-purple-600" />
                                    <div>
                                      <p className="text-xs font-medium text-purple-800">Reference</p>
                                      <a 
                                        href={session.referenceLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-purple-600 hover:underline"
                                      >
                                        View Link
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Session Agendas */}
                            {session.agendas && session.agendas.length > 0 && (
                              <div className="mb-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium text-gray-700">Session Agendas</h5>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600">
                                      {getAgendaCompletion(session.agendas)}% Complete
                                    </span>
                                    <Progress 
                                      value={getAgendaCompletion(session.agendas)} 
                                      className="w-16 h-1"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  {session.agendas.map((agenda) => (
                                    <div key={agenda.id} className="flex items-center gap-2 p-2">
                                      {agenda.complete ? (
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-gray-400" />
                                      )}
                                      <span className={cn(
                                        "text-xs flex-1",
                                        agenda.complete ? "line-through text-gray-500" : "text-gray-700"
                                      )}>
                                        {agenda.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Activity Found
              </h3>
              <p className="text-gray-600">
                No employee activity recorded for {format(selectedDate, "MMM dd, yyyy")}.
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="mt-4"
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}