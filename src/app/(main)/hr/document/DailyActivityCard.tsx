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
  MapPin, 
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

  // Calculate summary statistics
  const activeEmployees = dailyActivities.filter(activity => activity.activeSession).length;
  const completedCheckouts = dailyActivities.filter(activity => activity.checkOutTime !== null).length;
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
    if (agendas.length === 0) return 0;
    const completed = agendas.filter(agenda => agenda.complete).length;
    return Math.round((completed / agendas.length) * 100);
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
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? "..." : dailyActivities.length}
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
          <CardTitle className="flex items-center  gap-2">
            <Users className="h-5 w-5" />
            Employee Activity Details ({dailyActivities.length})
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
          ) : dailyActivities.length > 0 ? (
            <div className="space-y-6">
              {dailyActivities.map((activity) => (
                <Card key={activity.employeeId} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    {/* Employee Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {activity.employeeName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{activity.employeeName}</h3>
                          <p className="text-sm text-gray-600">{activity.employeeId}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{activity.checkInLocation}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge 
                          variant={activity.activeSession ? "default" : "secondary"}
                          className={activity.activeSession ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {activity.activeSession ? "Active" : "Completed"}
                        </Badge>
                        {activity.totalMinutesWorked !== null && (
                          <p className="text-sm font-medium mt-1">
                            {formatMinutesToHours(activity.totalMinutesWorked)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Time Details */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <LogIn className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Check In</p>
                          <p className="text-sm text-green-600">{formatTime(activity.checkInTime)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <LogOut className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Check Out</p>
                          <p className="text-sm text-red-600">
                            {activity.checkOutTime ? formatTime(activity.checkOutTime) : "Not checked out"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Agendas */}
                    {activity.agendas.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Daily Agendas</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {getAgendaCompletion(activity.agendas)}% Complete
                            </span>
                            <Progress 
                              value={getAgendaCompletion(activity.agendas)} 
                              className="w-20 h-2"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {activity.agendas.map((agenda) => (
                            <div key={agenda.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              {agenda.complete ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={cn(
                                "text-sm flex-1",
                                agenda.complete ? "line-through text-gray-500" : "text-gray-900"
                              )}>
                                {agenda.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {activity.remark && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Remark</p>
                            <p className="text-sm text-blue-600">{activity.remark}</p>
                          </div>
                        </div>
                      )}
                      
                      {activity.referenceLink && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <ExternalLink className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-purple-800">Reference</p>
                            <a 
                              href={activity.referenceLink} 
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
                  </CardContent>
                </Card>
              ))}
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