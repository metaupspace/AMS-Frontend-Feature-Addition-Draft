export function formatTime(timeValue) {
  // Handle null, undefined, or empty values
  if (!timeValue) {
    return 'N/A';
  }

  try {
    // Convert to Date object if it's a string
    const date = typeof timeValue === 'string' ? new Date(timeValue) : timeValue;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', timeValue);
      return 'Invalid Time';
    }

    // Format the time
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Error';
  }
}