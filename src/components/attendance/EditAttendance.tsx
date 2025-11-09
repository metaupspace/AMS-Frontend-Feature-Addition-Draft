"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Edit,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { attendanceQueries } from "@/queries/attendance";
import { AttendanceRecord, AttendanceEditRequestDto } from "@/models/attendance";
import { useAuth } from "@/app/context/AuthContext";
import ScrollableTimePicker from "./ScrollableTimePicker";

interface EditAttendanceProps {
  record: AttendanceRecord;
  attendance: AttendanceRecord[];
  onClose?: () => Promise<void>;
  pendingEdit?: boolean;
}

interface ValidationErrors {
  checkIn?: string;
  checkOut?: string;
  remark?: string;
  general?: string;
}

const FormatTime = (timeString?: string): string => {
  if (!timeString) return "";

  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeString;
  }
};

// Enhanced time validation and parsing
const validateAndParseTime = (
  timeString: string,
  baseDate?: string
): {
  isValid: boolean;
  parsedTime?: string;
  error?: string;
} => {
  const trimmedTime = timeString.trim();

  if (trimmedTime === "") {
    return { isValid: false, error: "Time cannot be just spaces" };
  }

  const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
  const match = trimmedTime.match(timeRegex);

  if (!match) {
    return {
      isValid: false,
      error:
        "Invalid time format. Use format: HH:MM AM/PM (e.g., 9:30 AM, 12:00 PM)",
    };
  }

  try {
    const base = baseDate ? new Date(baseDate) : new Date();
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const meridiem = match[3].toUpperCase();

    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    const result = new Date(base);
    result.setHours(hours, minutes, 0, 0);

    if (isNaN(result.getTime())) {
      return {
        isValid: false,
        error: "Invalid time value",
      };
    }

    const year = result.getFullYear();
    const month = String(result.getMonth() + 1).padStart(2, "0");
    const day = String(result.getDate()).padStart(2, "0");
    const hh = String(result.getHours()).padStart(2, "0");
    const mm = String(result.getMinutes()).padStart(2, "0");
    const ss = "00";

    return {
      isValid: true,
      parsedTime: `${year}-${month}-${day}T${hh}:${mm}:${ss}`,
    };
  } catch {
    return {
      isValid: false,
      error: "Failed to parse time",
    };
  }
};

const validateRemark = (
  remark: string
): { isValid: boolean; error?: string } => {
  if (!remark || !remark.trim()) {
    return { isValid: false, error: "Reason is required" };
  }

  const trimmedRemark = remark.trim();

  if (trimmedRemark.length < 10) {
    return {
      isValid: false,
      error: "Reason must be at least 10 characters long",
    };
  }

  if (trimmedRemark.length > 500) {
    return { isValid: false, error: "Reason cannot exceed 500 characters" };
  }

  const repeatedCharPattern = /^(.)\1{9,}$/;
  if (repeatedCharPattern.test(trimmedRemark)) {
    return { isValid: false, error: "Please provide a meaningful reason" };
  }

  const wordCount = trimmedRemark
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  if (wordCount < 3) {
    return { isValid: false, error: "Reason must contain at least 3 words" };
  }

  return { isValid: true };
};

const validateTimeConsistency = (
  checkInTime: string,
  checkOutTime: string,
  baseDate?: string
): {
  isValid: boolean;
  error?: string;
} => {
  if (!checkInTime || !checkOutTime) {
    return { isValid: true };
  }

  const checkInValidation = validateAndParseTime(checkInTime, baseDate);
  const checkOutValidation = validateAndParseTime(checkOutTime, baseDate);

  if (!checkInValidation.isValid || !checkOutValidation.isValid) {
    return { isValid: true };
  }

  const checkInDate = new Date(checkInValidation.parsedTime!);
  const checkOutDate = new Date(checkOutValidation.parsedTime!);

  if (checkOutDate <= checkInDate) {
    return {
      isValid: false,
      error: "Check-out time must be after check-in time",
    };
  }

  const diffHours =
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
  if (diffHours > 24) {
    return {
      isValid: false,
      error: "Work duration cannot exceed 24 hours",
    };
  }

  return { isValid: true };
};

const checkTimeOverlap = (
  newCheckIn: string,
  newCheckOut: string,
  currentRecordId: string,
  allAttendance: AttendanceRecord[]
): {
  hasOverlap: boolean;
  error?: string;
  conflictingRecord?: AttendanceRecord;
} => {
  if (!newCheckIn || !newCheckOut) {
    return { hasOverlap: false };
  }

  const newCheckInTime = new Date(newCheckIn);
  const newCheckOutTime = new Date(newCheckOut);

  const otherRecords = allAttendance.filter(
    (record) =>
      record.id !== currentRecordId && record.checkInTime && record.checkOutTime
  );

  for (const record of otherRecords) {
    const existingCheckIn = new Date(record.checkInTime!);
    const existingCheckOut = new Date(record.checkOutTime!);

    const isSameDate =
      newCheckInTime.toDateString() === existingCheckIn.toDateString();

    if (isSameDate) {
      const hasOverlap =
        newCheckInTime < existingCheckOut && newCheckOutTime > existingCheckIn;

      if (hasOverlap) {
        const conflictDate = existingCheckIn.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const conflictTimeRange = `${FormatTime(
          record.checkInTime
        )} - ${FormatTime(record.checkOutTime)}`;

        return {
          hasOverlap: true,
          error: `Time slot overlaps with existing attendance on ${conflictDate} (${conflictTimeRange})`,
          conflictingRecord: record,
        };
      }
    }
  }

  return { hasOverlap: false };
};

const getConflictingRecords = (
  newCheckIn: string,
  newCheckOut: string,
  currentRecordId: string,
  allAttendance: AttendanceRecord[]
): AttendanceRecord[] => {
  if (!newCheckIn || !newCheckOut) return [];

  const newCheckInTime = new Date(newCheckIn);
  const newCheckOutTime = new Date(newCheckOut);

  return allAttendance.filter((record) => {
    if (
      record.id === currentRecordId ||
      !record.checkInTime ||
      !record.checkOutTime
    ) {
      return false;
    }

    const existingCheckIn = new Date(record.checkInTime);
    const existingCheckOut = new Date(record.checkOutTime);

    const isSameDate =
      newCheckInTime.toDateString() === existingCheckIn.toDateString();
    const hasOverlap =
      isSameDate &&
      newCheckInTime < existingCheckOut &&
      newCheckOutTime > existingCheckIn;

    return hasOverlap;
  });
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const EditAttendance: React.FC<EditAttendanceProps> = ({
  record,
  attendance,
  onClose,
  pendingEdit,
}) => {
  const { employee, isLoading: authLoading, isInitialized } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [conflictingRecords, setConflictingRecords] = useState<
    AttendanceRecord[]
  >([]);

  const queryClient = useQueryClient();
  const effectiveEmployeeId = employee?.employeeId;

  const hasPendingRequest = (pendingEdit === true) || record.editRequestStatus === "PENDING";

  useEffect(() => {
    if (open) {
      setCheckIn(FormatTime(record.checkInTime));
      setCheckOut(FormatTime(record.checkOutTime));
      setRemark(record.remark || "");
      setErrors({});
      setSuccessMessage("");
      setTouched({});
      setConflictingRecords([]);
    }
  }, [open, record]);

  useEffect(() => {
    if (errors.general || successMessage) {
      const timer = setTimeout(() => {
        setErrors((prev) => ({ ...prev, general: undefined }));
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors.general, successMessage]);

  const validateField = (field: string, value: string) => {
    const newErrors: ValidationErrors = { ...errors };

    switch (field) {
      case "checkIn":
        if (value.trim()) {
          const validation = validateAndParseTime(value, record.checkInTime);
          if (!validation.isValid) {
            newErrors.checkIn = validation.error;
          } else {
            delete newErrors.checkIn;
          }
        } else {
          delete newErrors.checkIn;
        }
        break;

      case "checkOut":
        if (value.trim()) {
          const validation = validateAndParseTime(
            value,
            record.checkOutTime || undefined
          );
          if (!validation.isValid) {
            newErrors.checkOut = validation.error;
          } else {
            delete newErrors.checkOut;
          }
        } else {
          delete newErrors.checkOut;
        }
        break;

      case "remark":
        const remarkValidation = validateRemark(value);
        if (!remarkValidation.isValid) {
          newErrors.remark = remarkValidation.error;
        } else {
          delete newErrors.remark;
        }
        break;
    }

    setErrors(newErrors);
  };

  const checkOverlapValidation = (
    currentCheckIn: string,
    currentCheckOut: string
  ) => {
    if (!currentCheckIn.trim() || !currentCheckOut.trim()) {
      setConflictingRecords([]);
      return;
    }

    const checkInValidation = validateAndParseTime(
      currentCheckIn,
      record.checkInTime
    );
    const checkOutValidation = validateAndParseTime(
      currentCheckOut,
      record.checkOutTime || undefined
    );

    if (
      checkInValidation.isValid &&
      checkOutValidation.isValid &&
      checkInValidation.parsedTime &&
      checkOutValidation.parsedTime
    ) {
      const overlapCheck = checkTimeOverlap(
        checkInValidation.parsedTime,
        checkOutValidation.parsedTime,
        record.id,
        attendance
      );

      if (overlapCheck.hasOverlap) {
        setErrors((prev) => ({ ...prev, general: overlapCheck.error }));
        const conflicts = getConflictingRecords(
          checkInValidation.parsedTime,
          checkOutValidation.parsedTime,
          record.id,
          attendance
        );
        setConflictingRecords(conflicts);
      } else {
        setErrors((prev) => ({ ...prev, general: undefined }));
        setConflictingRecords([]);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case "checkIn":
        setCheckIn(value);
        break;
      case "checkOut":
        setCheckOut(value);
        break;
      case "remark":
        setRemark(value);
        break;
    }

    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);

    if (
      (field === "checkIn" || field === "checkOut") &&
      checkIn.trim() &&
      checkOut.trim()
    ) {
      const currentCheckIn = field === "checkIn" ? value : checkIn;
      const currentCheckOut = field === "checkOut" ? value : checkOut;

      const consistencyValidation = validateTimeConsistency(
        currentCheckIn,
        currentCheckOut,
        record.checkInTime
      );

      if (!consistencyValidation.isValid) {
        setErrors((prev) => ({
          ...prev,
          general: consistencyValidation.error,
        }));
        setConflictingRecords([]);
      } else {
        checkOverlapValidation(currentCheckIn, currentCheckOut);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const checkInValidation = validateAndParseTime(checkIn, record.checkInTime);
    const checkOutValidation = validateAndParseTime(
      checkOut,
      record.checkOutTime || undefined
    );
    const remarkValidation = validateRemark(remark);

    if (checkIn.trim() && !checkInValidation.isValid) {
      newErrors.checkIn = checkInValidation.error;
    }

    if (checkOut.trim() && !checkOutValidation.isValid) {
      newErrors.checkOut = checkOutValidation.error;
    }

    if (!remarkValidation.isValid) {
      newErrors.remark = remarkValidation.error;
    }

    if (!checkIn.trim() && !checkOut.trim()) {
      newErrors.general = "Please specify at least check-in or check-out time";
    }

    if (
      checkIn.trim() &&
      checkOut.trim() &&
      checkInValidation.isValid &&
      checkOutValidation.isValid
    ) {
      const consistencyValidation = validateTimeConsistency(
        checkIn,
        checkOut,
        record.checkInTime
      );
      if (!consistencyValidation.isValid) {
        newErrors.general = consistencyValidation.error;
      } else {
        const overlapCheck = checkTimeOverlap(
          checkInValidation.parsedTime!,
          checkOutValidation.parsedTime!,
          record.id,
          attendance
        );
        if (overlapCheck.hasOverlap) {
          newErrors.general = overlapCheck.error;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      const attendanceDate = record.checkInTime
        ? new Date(record.checkInTime).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      let requestCheckIn = record.checkInTime;
      let requestCheckOut = record.checkOutTime || "";

      if (checkIn.trim()) {
        const checkInValidation = validateAndParseTime(
          checkIn,
          record.checkInTime
        );
        if (checkInValidation.isValid && checkInValidation.parsedTime) {
          requestCheckIn = checkInValidation.parsedTime;
        }
      }

      if (checkOut.trim()) {
        const checkOutValidation = validateAndParseTime(
          checkOut,
          record.checkOutTime || undefined
        );
        if (checkOutValidation.isValid && checkOutValidation.parsedTime) {
          requestCheckOut = checkOutValidation.parsedTime;
        }
      }

      const editRequestData: AttendanceEditRequestDto = {
        attendanceId: record.id,
        requestCheckIn,
        requestCheckOut,
        reason: remark.trim(),
      };

      const response = await attendanceQueries.requestEditAttendance(
        editRequestData
      );

      if (response) {
        const queriesToInvalidate = [
          ["attendance-records", effectiveEmployeeId], 
          ["my-edit-requests", effectiveEmployeeId],
          ["monthly-attendance", effectiveEmployeeId], 
        ];

        await Promise.all(
          queriesToInvalidate.map((queryKey) =>
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

      let errorMessage = "Failed to submit edit request";

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a future time validation error
        if (errorMessage.includes("PastOrPresent") || errorMessage.includes("cannot be in the future")) {
          errorMessage = "Edit request can't be in future";
        } else {
          // Extract the user-friendly message from Spring Boot validation error if present
          const allMatches = errorMessage.match(/default message\[([^\]]+)\]/g);
          if (allMatches && allMatches.length > 0) {
            // Get the last match and extract the content
            const lastMatch = allMatches[allMatches.length - 1];
            const messageContent = lastMatch.match(/default message\[([^\]]+)\]/);
            if (messageContent && messageContent[1]) {
              errorMessage = messageContent[1];
            }
          }
        }
      } else if (typeof error === "object" && error !== null) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.status) {
          errorMessage = `Request failed with status ${apiError.response.status}`;
        }
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = async (newOpen: boolean): Promise<void> => {
    if (!newOpen && isSubmitting) {
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      if (onClose) {
        await onClose();
      }
      setCheckIn("");
      setCheckOut("");
      setRemark("");
      setErrors({});
      setSuccessMessage("");
      setTouched({});
      setConflictingRecords([]);
    }
  };

  const isFormValid = () => {
    const validErrors = Object.entries(errors).filter(
      ([key, value]) => value !== undefined && value !== null && value !== ""
    );

    return (
      validErrors.length === 0 &&
      remark.trim().length >= 10 &&
      (checkIn.trim() || checkOut.trim())
    );
  };

  if (hasPendingRequest) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <button
            className="p-1 hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            aria-label="Edit attendance record"
            disabled={!isInitialized || authLoading || hasPendingRequest}
            title={hasPendingRequest ? "Edit disabled while request is pending" : "Edit attendance"}
          >
            <Edit size={18} className="text-gray-600" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/20 animate-in fade-in-0 z-50" />

          <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Edit Attendance Request
                    </Dialog.Title>
                    {hasPendingRequest && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        Pending
                      </span>
                    )}
                  </div>
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
              {(!isInitialized || authLoading) && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Loading authentication...</p>
                </div>
              )}

              {hasPendingRequest && (
                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        Request Pending Approval
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        You have an edit request pending for this attendance
                        record.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      {successMessage}
                    </span>
                  </div>
                </div>
              )}

              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      {errors.general}
                    </span>
                  </div>
                </div>
              )}

              {conflictingRecords.length > 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Conflicting Attendance Records:
                      </p>
                      <div className="space-y-1">
                        {conflictingRecords.map((conflict) => (
                          <div
                            key={conflict.id}
                            className="text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1"
                          >
                            {formatDate(conflict.checkInTime || "")} •{" "}
                            {FormatTime(conflict.checkInTime)} -{" "}
                            {FormatTime(conflict.checkOutTime)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Current Values
                </h4>
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

              {isInitialized && !authLoading && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="checkIn"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Check In Time
                    </label>
                    <ScrollableTimePicker
                      value={checkIn}
                      onChange={(value) => handleInputChange("checkIn", value)}
                      onBlur={(value) => handleBlur("checkIn", value)}
                      placeholder="e.g., 9:30 AM"
                      disabled={isSubmitting}
                      error={!!errors.checkIn}
                    />
                    {errors.checkIn && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.checkIn}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: HH:MM AM/PM (Leave blank to keep current)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="checkOut"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Check Out Time
                    </label>
                    <ScrollableTimePicker
                      value={checkOut}
                      onChange={(value) => handleInputChange("checkOut", value)}
                      onBlur={(value) => handleBlur("checkOut", value)}
                      placeholder="e.g., 5:30 PM"
                      disabled={isSubmitting}
                      error={!!errors.checkOut}
                    />
                    {errors.checkOut && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.checkOut}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: HH:MM AM/PM (Leave blank to keep current)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="remark"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reason for Correction{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="remark"
                      rows={3}
                      placeholder="Please provide a detailed reason for this attendance correction (minimum 10 characters, at least 3 words)..."
                      onChange={(e) =>
                        handleInputChange("remark", e.target.value)
                      }
                      onBlur={(e) => handleBlur("remark", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500 resize-none ${
                        errors.remark
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300"
                      }`}
                      disabled={isSubmitting}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.remark ? (
                        <p className="text-xs text-red-600">{errors.remark}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Minimum 10 characters, at least 3 words
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {remark.length}/500
                      </p>
                    </div>
                  </div>

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
                      disabled={isSubmitting || !isFormValid()}
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
    </div>
  );
};

export default EditAttendance;
