import { describe, expect, it } from 'vitest';

import { dayOfYear, daysBetween, isCalendarDay } from '../../../src/util/local-dates';

describe('isCalendarDay', () => {
  it.each([
    [ 2026, 1, 1, ],
    [ 2026, 12, 31, ],
    [ 2026, 4, 30, ],
    [ 2024, 2, 29, ], // a leap year
    [ 2000, 2, 29, ], // a century divisible by 400 is a leap year
  ])('accepts %i-%i-%i', (year, month, day) => {
    expect(isCalendarDay(year, month, day)).toBe(true);
  });

  it.each([
    [ 2026, 2, 29, ], // not a leap year
    [ 1900, 2, 29, ], // a century not divisible by 400 is not a leap year
    [ 2026, 4, 31, ],
    [ 2026, 13, 1, ],
    [ 2026, 0, 1, ],
    [ 2026, 1, 0, ],
    [ 2026, 1, 32, ],
  ])('rejects %i-%i-%i', (year, month, day) => {
    expect(isCalendarDay(year, month, day)).toBe(false);
  });
});

describe('dayOfYear', () => {
  it.each([
    [ '2026-01-01', 1, ],
    [ '2026-03-01', 60, ],
    [ '2028-03-01', 61, ], // after 29 February
    [ '2026-12-31', 365, ],
    [ '2028-12-31', 366, ],
    [ '2000-12-31', 366, ],
    [ '1900-12-31', 365, ],
    [ '2026-03-08', 67, ], // the spring clock change in America/New_York
    [ '2026-11-01', 305, ], // the autumn clock change
  ])('%s is day %i', (date, day) => {
    expect(dayOfYear(date)).toBe(day);
  });

  it('refuses a string that is not a calendar day', () => {
    expect(() => dayOfYear('2026-02-30')).toThrow('2026-02-30');
  });
});

describe('daysBetween', () => {
  it.each([
    [ '2026-07-01', '2026-07-01', 0, ],
    [ '2026-07-01', '2026-07-02', 1, ],
    [ '2026-07-02', '2026-07-01', -1, ],
    [ '2026-03-08', '2026-03-09', 1, ], // the spring clock change: a 23-hour day is still one day
    [ '2026-03-07', '2026-03-08', 1, ],
    [ '2026-11-01', '2026-11-02', 1, ], // the autumn clock change: a 25-hour day is still one day
    [ '2026-10-31', '2026-11-01', 1, ],
    [ '2026-12-31', '2027-01-01', 1, ],
    [ '2026-02-28', '2026-03-01', 1, ],
    [ '2028-02-28', '2028-03-01', 2, ],
    [ '2026-01-01', '2027-01-01', 365, ],
    [ '2028-01-01', '2029-01-01', 366, ],
    [ '2000-01-01', '2100-01-01', 36525, ], // a century: 2000 is a leap year and 2100 isn't reached
  ])('from %s to %s is %i', (from, to, days) => {
    expect(daysBetween(from, to)).toBe(days);
  });

  it('refuses a string that is not a calendar day', () => {
    expect(() => daysBetween('2026-07-01', '2026-13-01')).toThrow('2026-13-01');
  });
});
