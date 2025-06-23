"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Timer,
  RefreshCw,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
// Using native JavaScript date methods
import { attendanceQueries } from "@/queries/attendance";
import { useAuth } from "@/app/context/AuthContext";
import { CheckInModal } from "./CheckInModal";
import { CheckOutModal } from "./CheckOutModal";

export default function CheckInOutPage() {
  const { user, employee, isLoading: authLoading, isInitialized } = useAuth();
  const queryClient = useQueryClient();
  
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

 

  // Wait for auth to be initialized before making queries
  const canMakeQueries = Boolean(isInitialized && !authLoading && user?.employeeId && employee?.employeeId);

  // Get current active session - Updated to handle both 404 and 400 errors
  const {
    data: currentSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
    error: sessionError,
    isError: hasSessionError,
  } = useQuery({
    queryKey: ["current-session", employee?.employeeId],
    queryFn: () => {
      console.log("Querying current session for employee:", employee?.employeeId);
      return attendanceQueries.getCurrentSession(employee!.employeeId);
    },
    enabled: canMakeQueries,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 400 or 404 (no active session)
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: 2000, // Wait 2 seconds between retries
  });

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false);
    queryClient.invalidateQueries({ queryKey: ["current-session"] });
  };

  const handleCheckOutSuccess = () => {
    setShowCheckOutModal(false);
    queryClient.invalidateQueries({ queryKey: ["current-session"] });
  };

  const handleRefresh = () => {
    console.log("Refreshing attendance data...");
    refetchSession();
  };

  const calculateWorkingTime = (checkInTime: string) => {
    const startTime = new Date(checkInTime);
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Invalid Time' + error.message;
    }
  };


  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if the error is a real error (not 400/404 which means no active session)
  const isRealError = hasSessionError && sessionError?.response?.status !== 400 && sessionError?.response?.status !== 404;

  // Show loading state while auth is initializing
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-[#F7FCFE] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#F7FCFE] flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-[#F7FCFE]">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Real Error Display (not 400/404) */}
        {isRealError && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-medium text-red-900">Connection Error</h4>
                  <p className="text-sm text-red-700">
                    Failed to load session data. Please try refreshing.
                    {sessionError?.response?.status && ` (Error ${sessionError.response.status})`}
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Status Card */}
        <Card className="bg-white border-gray-100 shadow-lg">
          <CardContent className="p-8">
            {sessionLoading ? (
              <div className="text-center py-12">
                <Timer className="h-12 w-12 mx-auto mb-4 text-[#1F6CB6] animate-spin" />
                <p className="text-gray-600">Loading session data...</p>
              </div>
            ) : currentSession ? (
              // Checked In State
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Currently Working
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-900">
                    You`re checked in!
                  </h2>
                </div>

                {/* Working Time */}
                <div className="bg-[#F7FCFE] rounded-lg p-6 border border-[#1F6CB6]/20">
                  <p className="text-sm text-gray-600 mb-2">Time Worked Today</p>
                  <p className="text-4xl font-bold text-[#1F6CB6]">
                    {calculateWorkingTime(currentSession.checkInTime)}
                  </p>
                </div>

                {/* Session Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3">
                      <LogIn className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Check-in Time</p>
                        <p className="text-lg font-semibold text-green-900">
                          {formatTime(currentSession.checkInTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Location</p>
                        <p className="text-sm text-blue-600 truncate">
                          {currentSession.checkInLocation || "Location not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Check Out Button */}
                <Button
                  onClick={() => setShowCheckOutModal(true)}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                >
                  <LogOut className="h-6 w-6 mr-3" />
                  Check Out & End Day
                </Button>
              </div>
            ) : (
              // Not Checked In State
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <Timer className="h-16 w-16 mx-auto text-gray-400" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Ready to Start Your Day?
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You haven`t checked in today. Start tracking your work hours by checking in now.
                  </p>
                </div>

                {/* Check In Button */}
                <Button
                  onClick={() => setShowCheckInModal(true)}
                  size="lg"
                  className="bg-[#1F6CB6] hover:bg-[#1A5A9E] text-white px-8 py-4 text-lg"
                  disabled={sessionLoading}
                >
                  <LogIn className="h-6 w-6 mr-3" />
                  Check In & Start Day
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-[#1F6CB6]" />
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">
                {sessionLoading ? "Loading..." : currentSession ? "Working" : "Not Started"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 text-center">
              <Timer className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Time Today</p>
              <p className="font-semibold text-gray-900">
                {sessionLoading ? "..." : currentSession ? calculateWorkingTime(currentSession.checkInTime) : "0h 0m"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-sm">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {formatShortDate(new Date())}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={sessionLoading}
            className="border-[#1F6CB6] text-[#1F6CB6] hover:bg-[#1F6CB6] hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${sessionLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={handleCheckInSuccess}
        employee={employee}
      />

      <CheckOutModal
        isOpen={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        onSuccess={handleCheckOutSuccess}
        currentSession={currentSession}
      />
    </div>
  );
}