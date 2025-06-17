import { parseISO, format, formatDistanceToNow } from "date-fns";

export function timeFromNow(isoDate: string): string {
  if (!isoDate) {
    return "";
  }

  try {
    const date = parseISO(isoDate);

    const relativeTime = formatDistanceToNow(date, { addSuffix: true });

    return relativeTime;
  } catch (error) {
    console.error("Invalid date format:", error);
    return "Invalid date";
  }
}

export const displayTimeStamp = (date: string): string => {
  if (!date) {
    return "";
  }
  return format(parseISO(date), "d MMM yyyy, HH:mm");
};

export const displayDate = (isoDate: string): string => {
  if (!isoDate) {
    return "";
  }
  return format(parseISO(isoDate), "d MMM yyyy");
};
