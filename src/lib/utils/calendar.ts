export const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns the default calendar year:
 * - Before March 1  → current year
 * - March 1 or later → next year
 */
export function getDefaultYear(): number {
	const now = new Date();
	const marchFirst = new Date(now.getFullYear(), 2, 1);
	return now >= marchFirst ? now.getFullYear() + 1 : now.getFullYear();
}

/**
 * Returns a 6×7 grid of day numbers (1-based) or null for padding cells.
 * @param year  Full year (e.g. 2027)
 * @param month 0-based month index (0 = January … 11 = December)
 */
export function getMonthGrid(year: number, month: number): (number | null)[] {
	const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells: (number | null)[] = [];

	// Leading padding
	for (let i = 0; i < firstDay; i++) {
		cells.push(null);
	}
	// Day numbers
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push(d);
	}
	// Trailing padding to reach a multiple of 7
	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	return cells;
}

/**
 * Formats a date as YYYY-MM-DD for use as CalendarEvent.date.
 */
export function toDateString(year: number, month: number, day: number): string {
	const mm = String(month + 1).padStart(2, '0');
	const dd = String(day).padStart(2, '0');
	return `${year}-${mm}-${dd}`;
}
