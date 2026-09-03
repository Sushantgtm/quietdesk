/**
 * Quiet Desk - Shared Date Utilities
 * Enforces unified, consistent date calculations across:
 * - New registration
 * - Website reservation approval
 * - Package renewal
 * - Booking creation & edit
 * - Student profile & dashboard metrics
 */

// Helper to safely parse YYYY-MM-DD into a local Date avoiding UTC offset shifts
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (typeof dateStr !== 'string') return new Date(dateStr);
  const parts = dateStr.split('T')[0].split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return new Date(dateStr);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // Noon prevents any daylight/DST midnight shift
};

// Helper to format Date to YYYY-MM-DD
export const formatLocalDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get exact number of days for each package
export const getPackageDays = (passType) => {
  const pt = String(passType || '').toUpperCase();
  if (pt === 'WEEKLY') return 7;
  if (pt === 'MONTHLY') return 30;
  return 1; // DAILY is exactly 1 full day (e.g. Sep 4 -> Sep 5)
};

/**
 * Calculates end/expiry date from a start date and pass type.
 * - DAILY: +1 day (Start: Sep 4 -> Expiry: Sep 5)
 * - WEEKLY: +7 days (Start: Sep 4 -> Expiry: Sep 11)
 * - MONTHLY: +30 days (Start: Sep 4 -> Expiry: Oct 4)
 */
export const calculatePackageEndDate = (startDateStr, passType) => {
  const d = parseLocalDate(startDateStr);
  const days = getPackageDays(passType);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

/**
 * Calculates renewal expiry date based on current end date and selected package.
 * - If current end date is in the future or today: extends from current end date.
 * - If current end date was in the past (expired): extends starting from today.
 */
export const calculateRenewalEndDate = (currentEndDateStr, passType) => {
  const todayStr = formatLocalDate(new Date());
  const baseStr = (currentEndDateStr && currentEndDateStr >= todayStr) ? currentEndDateStr : todayStr;
  return calculatePackageEndDate(baseStr, passType);
};

/**
 * Calculates exact days remaining from today until endDate.
 * Positive = active days remaining
 * 0 = expires today
 * Negative = days expired
 */
export const calculateDaysRemaining = (endDateStr) => {
  if (!endDateStr) return null;
  const exp = parseLocalDate(endDateStr);
  const today = parseLocalDate(formatLocalDate(new Date()));
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((exp.getTime() - today.getTime()) / msPerDay);
};
