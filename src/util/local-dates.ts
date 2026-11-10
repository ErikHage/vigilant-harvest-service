/**
 * Calendar arithmetic on local dates, written YYYY-MM-DD. A local date is a day
 * on the user's calendar, not an instant, so this never makes a JS Date: a Date
 * would tie the day to a time zone, and a day across a clock change would be 23
 * or 25 hours long.
 *
 * The functions here expect dates that have already been validated, and throw on
 * one that isn't a calendar day; that is a bug in the caller, not bad input.
 */

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days in each month of a year that isn't a leap year. */
const DAYS_IN_MONTH = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, ];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1]!;
}

export function isCalendarDay(year: number, month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

interface CalendarDay {
  year: number,
  month: number,
  day: number,
}

function parse(date: string): CalendarDay {
  const parts = LOCAL_DATE.exec(date);
  const [ year, month, day, ] = (parts?.slice(1) ?? []).map(Number) as [number, number, number];

  if (!parts || !isCalendarDay(year, month, day)) {
    throw new Error(`Not a local date, as YYYY-MM-DD: ${date}`);
  }

  return { year, month, day, };
}

/** 1 for 1 January, up to 365, or 366 in a leap year. */
export function dayOfYear(date: string): number {
  const { year, month, day, } = parse(date);
  let days = day;

  for (let earlier = 1; earlier < month; earlier++) {
    days += daysInMonth(year, earlier);
  }

  return days;
}

/**
 * Days since 1970-01-01 in the proleptic Gregorian calendar, by Howard Hinnant's
 * days_from_civil: whole-number arithmetic, with the year starting in March so
 * that 29 February falls at its end.
 */
function dayNumber(date: string): number {
  const { year, month, day, } = parse(date);
  const marchYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(marchYear / 400);
  const yearOfEra = marchYear - era * 400;
  const dayOfMarchYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfMarchYear;

  return era * 146097 + dayOfEra - 719468;
}

/** Calendar days from one date to another: 1 from today to tomorrow, -1 back again. */
export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}
