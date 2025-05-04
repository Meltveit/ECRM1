import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns'; // Ensure date-fns is installed

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Firestore Timestamp into a readable string.
 * @param timestamp The Firestore Timestamp object.
 * @param formatString The desired date-fns format string (e.g., 'PPpp', 'yyyy-MM-dd'). Defaults to 'PP' (e.g., Oct 26, 2023).
 * @returns A formatted date string, or an empty string if the timestamp is invalid.
 */
export function formatTimestamp(timestamp: Timestamp | undefined | null, formatString: string = 'PP'): string {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return ''; // Return empty string for null, undefined, or invalid Timestamps
  }
  try {
    const date = timestamp.toDate();
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return 'Invalid Date';
  }
}
