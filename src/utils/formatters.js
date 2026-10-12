/**
 * Formats a number into Indian Rupee (INR) currency format.
 * Uses the Indian numbering system (lakhs, crores).
 * Example: 150000 -> ₹1,50,000
 */
export function formatINR(amount, showDecimals = false) {
  const num = Number(amount) || 0;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : (num % 1 !== 0 ? 2 : 0),
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
}

/**
 * Formats raw number with Indian comma grouping without currency symbol.
 * Example: 150000 -> 1,50,000
 */
export function formatIndianNumber(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats ISO date (YYYY-MM-DD) into readable format: "01 Oct 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats HH:mm or HH:mm:ss into 12-hour AM/PM format
 */
export function formatTime(timeString) {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time formatted as HH:mm
 */
export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
