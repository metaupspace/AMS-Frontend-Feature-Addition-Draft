"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Edit, X, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { attendanceQueries } from "@/queries/attendance";
import { AttendanceRecord, AttendanceEditRequest } from "@/models/attendance";
import { useAuth } from "@/app/context/AuthContext";


interface EditAttendanceProps {
  record: AttendanceRecord;
}


const FormatTime = (timeString?: string): string => {
  if (!timeString) return "";
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return timeString;
  }
};

const parseTimeToISO = (timeString: string, baseDate?: string): string => {
  if (!timeString.trim()) return "";
  
  try {
    const base = baseDate ? new Date(baseDate) : new Date();
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i;
    const match = timeString.trim().match(timeRegex);
    
    if (!match) return "";
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const meridiem = match[3]?.toUpperCase();
    
    if (meridiem) {
      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }
    }
    
    const result = new Date(base);
    result.setHours(hours, minutes, 0, 0);
    
    return result.toISOString();
  } catch {
    return "";
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

const EditAttendance: React.FC<EditAttendanceProps> = ({
  record
}) => {
  
  const {  employee, isLoading: authLoading, isInitialized } = useAuth();
  
  const [open, setOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  
  const queryClient = useQueryClient();

  const effectiveEmployeeId =  employee?.employeeId;

  useEffect(() => {
    if (open) {
      setCheckIn(FormatTime(record.checkInTime));
      setCheckOut(FormatTime(record.checkOutTime));
      setRemark(record.remark || "");
      setError("");
      setSuccessMessage("");
    }
  }, [open, record]);

  // Clear messages after timeout
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const handleRefresh = () => {
    setError("");
  };

  // Submit handler with enhanced error handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      
      if (!remark.trim()) {
        setError("Please provide a reason for the attendance correction.");
        setIsSubmitting(false);
        return;
      }

      if (!checkIn.trim() && !checkOut.trim()) {
        setError("Please specify at least check-in or check-out time.");
        setIsSubmitting(false);
        return;
      }

     
      const attendanceDate = record.checkInTime 
        ? new Date(record.checkInTime).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      
      const editRequestData: AttendanceEditRequest = {
        employeeId: effectiveEmployeeId,
        attendanceId: record.id,
        date: attendanceDate,
        requestCheckIn: checkIn ? parseTimeToISO(checkIn, record.checkInTime) : record.checkInTime,
        requestCheckOut: checkOut ? parseTimeToISO(checkOut, record.checkOutTime || undefined) : record.checkOutTime || "",
        reason: remark.trim(),
      };

      console.log("Submitting edit request:", editRequestData);

      
      const response = await attendanceQueries.requestEditAttendance(editRequestData);
      
      if (response) {
        console.log("Edit request submitted successfully:", response);
        
        // Invalidate and refetch related queries
        const queriesToInvalidate = [
          ['attendanceRecords', effectiveEmployeeId],
          ['monthlyAttendance', effectiveEmployeeId],
          ['todayAttendance', effectiveEmployeeId]
        ];

        await Promise.all(
          queriesToInvalidate.map(queryKey => 
            queryClient.invalidateQueries({ queryKey })
          )
        );
        
        
        setSuccessMessage("Attendance edit request submitted successfully!");
        

        setTimeout(() => {
          setOpen(false);
        }, 1500);
      }
    } catch (error: unknown) {
      console.error("Error submitting edit request:", error);
      
      // Enhanced error handling
      let errorMessage = "Failed to submit edit request";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.status) {
          errorMessage = `Request failed with status ${apiError.response.status}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean): void => {
    if (!newOpen && isSubmitting) {
      // Prevent closing while operations are in progress
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form and states
      setCheckIn("");
      setCheckOut("");
      setRemark("");
      setError("");
      setSuccessMessage("");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {/* Trigger Button */}
      <Dialog.Trigger asChild>
        <button 
          className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50"
          type="button"
          aria-label="Edit attendance record"
          disabled={!isInitialized || authLoading}
        >
          <Edit size={18} className="text-gray-600" />
        </button>
      </Dialog.Trigger>

      {/* Modal Portal */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 animate-in fade-in-0 z-50" />

        {/* Modal Content */}
        <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 z-50 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Edit Attendance Request
                </Dialog.Title>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(record.checkInTime || new Date().toISOString())}
                </p>
              </div>
              <Dialog.Close asChild>
                <button 
                  className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50" 
                  disabled={isSubmitting}
                  type="button"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="px-6 py-4">
            {/* Auth Loading State */}
            {(!isInitialized || authLoading) && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-gray-600">Loading authentication...</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Current Values Display */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Values</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Check In:</span>
                  <p className="font-medium text-gray-900">
                    {FormatTime(record.checkInTime) || "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Check Out:</span>
                  <p className="font-medium text-gray-900">
                    {FormatTime(record.checkOutTime) || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            {isInitialized && !authLoading && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Check In */}
                <div>
                  <label 
                    htmlFor="checkIn"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Check In Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="checkIn"
                      type="text"
                      placeholder="e.g., 9:30 AM"
                      value={checkIn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep current time</p>
                </div>

                {/* Check Out */}
                <div>
                  <label 
                    htmlFor="checkOut"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Check Out Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="checkOut"
                      type="text"
                      placeholder="e.g., 5:30 PM"
                      value={checkOut}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave blank to keep current time</p>
                </div>

                {/* Reason */}
                <div>
                  <label 
                    htmlFor="remark"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Reason for Correction <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="remark"
                    rows={3}
                    placeholder="Please provide a detailed reason for this attendance correction..."
                    value={remark}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={isSubmitting || !remark.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditAttendance;