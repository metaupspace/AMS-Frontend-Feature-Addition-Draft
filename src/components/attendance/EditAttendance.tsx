"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Edit, X } from "lucide-react";
import { useState } from "react";

type AttendanceRecord = {
  id: string;
  checkInTime?: string;
  checkOutTime?: string;
  remark?: string;
};

type EditAttendanceProps = {
  record: AttendanceRecord;
  onUpdate?: (updated: AttendanceRecord) => void;
  onDelete?: (id: string) => void;
};


const FormatTime = (timeString?: string): string => {
  if (!timeString) return "";
  
  try {
    const date = new Date(timeString);

    if (isNaN(date.getTime())) return timeString;
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedMinute = minutes.toString().padStart(2, "0");
    
    return `${hour12}:${formattedMinute} ${ampm}`;
  } catch {
    return timeString;
  }
};



export default function EditAttendance({
  record,
  onUpdate,
  onDelete,
}: EditAttendanceProps) {
  const [open, setOpen] = useState(false);
  
  const [checkIn, setCheckIn] = useState(FormatTime(record.checkInTime));
  const [checkOut, setCheckOut] = useState(FormatTime(record.checkOutTime));
  const [remark, setRemark] = useState(record.remark || "");
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    //left to implement the sumbi funtionality of th eform
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Trigger Button (icon) */}
      <Dialog.Trigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Edit size={18} className="text-gray-600" />
        </button>
      </Dialog.Trigger>

      {/* Overlay */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/10" />

        {/* Modal Content */}
        <Dialog.Content className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-800">
              Edit Attendance
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 hover:bg-gray-100">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Check In */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check In
              </label>
              <input
                type="text"
                placeholder="e.g., 9:30 AM"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            {/* Check Out */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check Out
              </label>
              <input
                type="text"
                placeholder="e.g., 5:30 PM"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}