import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class RegexPatterns {
  static USERNAME = /^(?=.{3,16}$)[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
  static PHONE =
    /^[+]?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
  static INDOS = /^[0-9]{2}[A-Z]{2}[0-9]{4}$/;
  static PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
  static EMAIL = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  static BLOOD_GROUP = /^(A|B|AB|O)[+-]$/;
  static PASSWORD =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
}
