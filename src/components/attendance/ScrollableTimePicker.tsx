"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface ScrollableTimePickerProps {
  value: string; // Format: "HH:MM AM/PM" or empty
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const ScrollableTimePicker: React.FC<ScrollableTimePickerProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "Select time",
  disabled = false,
  error = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");

  const pickerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const meridiemScrollRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const meridiems: ("AM" | "PM")[] = ["AM", "PM"];

  // Parse the value string when it changes
  useEffect(() => {
    if (value) {
      const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
      const match = value.match(timeRegex);
      if (match) {
        setHour(parseInt(match[1]));
        setMinute(parseInt(match[2]));
        setMeridiem(match[3].toUpperCase() as "AM" | "PM");
      }
    }
  }, [value]);

  // Scroll to selected values when picker opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected();
      }, 50);
    }
  }, [isOpen]);

  const scrollToSelected = () => {
    const itemHeight = 40; // Height of each item in pixels
    const containerHeight = 128; // 32 * 4 (h-32 = 8rem = 128px)
    const offset = (containerHeight - itemHeight) / 2; // Center offset

    if (hourScrollRef.current) {
      const hourIndex = hours.indexOf(hour);
      hourScrollRef.current.scrollTop = hourIndex * itemHeight + itemHeight - offset;
    }

    if (minuteScrollRef.current) {
      minuteScrollRef.current.scrollTop = minute * itemHeight + itemHeight - offset;
    }

    if (meridiemScrollRef.current) {
      const meridiemIndex = meridiems.indexOf(meridiem);
      meridiemScrollRef.current.scrollTop = meridiemIndex * itemHeight + itemHeight - offset;
    }
  };

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    items: any[],
    setter: (value: any) => void
  ) => {
    if (!ref.current) return;

    const itemHeight = 40;
    const containerHeight = 128;
    const scrollTop = ref.current.scrollTop;
    const offset = (containerHeight - itemHeight) / 2;
    
    // Calculate which item is in the center
    const centerPosition = scrollTop + offset;
    const centerIndex = Math.round((centerPosition - itemHeight) / itemHeight);
    const selectedIndex = Math.max(0, Math.min(centerIndex, items.length - 1));

    setter(items[selectedIndex]);
  };

  const formatTime = () => {
    if (!value) return "";
    return `${hour}:${minute.toString().padStart(2, "0")} ${meridiem}`;
  };

  const handleConfirm = () => {
    const formattedTime = `${hour}:${minute.toString().padStart(2, "0")} ${meridiem}`;
    onChange(formattedTime);
    setIsOpen(false);
    if (onBlur) {
      onBlur(formattedTime);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset to current value
    if (value) {
      const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM)$/i;
      const match = value.match(timeRegex);
      if (match) {
        setHour(parseInt(match[1]));
        setMinute(parseInt(match[2]));
        setMeridiem(match[3].toUpperCase() as "AM" | "PM");
      }
    }
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Input Display */}
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`w-full pl-10 pr-3 py-2 border rounded-lg cursor-pointer transition-colors duration-200 ${
          disabled
            ? "bg-gray-50 text-gray-500 cursor-not-allowed"
            : "bg-white hover:border-gray-400"
        } ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }`}
      >
        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
      </div>

      {/* Picker Modal */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72">
          <div className="flex gap-2 mb-4">
            {/* Hour Selector */}
            <div className="flex-1 relative">
              <div className="text-xs text-gray-500 text-center mb-2 font-medium">
                Hour
              </div>
              <div className="relative">
                <div
                  ref={hourScrollRef}
                  onScroll={() =>
                    handleScroll(hourScrollRef, hours, setHour)
                  }
                  className="h-32 overflow-y-scroll scrollbar-hide relative"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollBehavior: "smooth",
                  }}
                >
                  <div className="h-10" /> {/* Top padding */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      onClick={() => setHour(h)}
                      className={`h-10 flex items-center justify-center cursor-pointer scroll-snap-align-center transition-all duration-200 ${
                        h === hour
                          ? "text-gray-900 font-semibold text-lg"
                          : "text-gray-400 text-sm"
                      }`}
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {h}
                    </div>
                  ))}
                  <div className="h-10" /> {/* Bottom padding */}
                </div>
                {/* Center highlight */}
                <div className="absolute top-10 left-0 right-0 h-10 border-y-2 border-gray-200 pointer-events-none bg-gray-50/30" />
              </div>
            </div>

            {/* Minute Selector */}
            <div className="flex-1 relative">
              <div className="text-xs text-gray-500 text-center mb-2 font-medium">
                Minute
              </div>
              <div className="relative">
                <div
                  ref={minuteScrollRef}
                  onScroll={() =>
                    handleScroll(minuteScrollRef, minutes, setMinute)
                  }
                  className="h-32 overflow-y-scroll scrollbar-hide relative"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollBehavior: "smooth",
                  }}
                >
                  <div className="h-10" />
                  {minutes.map((m) => (
                    <div
                      key={m}
                      onClick={() => setMinute(m)}
                      className={`h-10 flex items-center justify-center cursor-pointer scroll-snap-align-center transition-all duration-200 ${
                        m === minute
                          ? "text-gray-900 font-semibold text-lg"
                          : "text-gray-400 text-sm"
                      }`}
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {m.toString().padStart(2, "0")}
                    </div>
                  ))}
                  <div className="h-10" />
                </div>
                <div className="absolute top-10 left-0 right-0 h-10 border-y-2 border-gray-200 pointer-events-none bg-gray-50/30" />
              </div>
            </div>

            {/* Meridiem Selector */}
            <div className="flex-1 relative">
              <div className="text-xs text-gray-500 text-center mb-2 font-medium">
                Period
              </div>
              <div className="relative">
                <div
                  ref={meridiemScrollRef}
                  onScroll={() =>
                    handleScroll(meridiemScrollRef, meridiems, setMeridiem)
                  }
                  className="h-32 overflow-y-scroll scrollbar-hide relative"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollBehavior: "smooth",
                  }}
                >
                  <div className="h-10" />
                  {meridiems.map((m) => (
                    <div
                      key={m}
                      onClick={() => setMeridiem(m)}
                      className={`h-10 flex items-center justify-center cursor-pointer scroll-snap-align-center transition-all duration-200 ${
                        m === meridiem
                          ? "text-gray-900 font-semibold text-lg"
                          : "text-gray-400 text-sm"
                      }`}
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {m}
                    </div>
                  ))}
                  <div className="h-10" />
                </div>
                <div className="absolute top-10 left-0 right-0 h-10 border-y-2 border-gray-200 pointer-events-none bg-gray-50/30" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Hide scrollbar globally for this component */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ScrollableTimePicker;
