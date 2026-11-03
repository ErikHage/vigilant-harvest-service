import { Request } from 'express';

import { BadRequestError } from '../errors/common';

/**
 * Checks for values that come from a request: a body field, a route param or a
 * query param. Each returns the checked value, or throws a BadRequestError that
 * names the field, so the client is told which input to fix.
 *
 * Numbers may arrive as numeric strings ("2026"): route and query params always
 * do, and the app sends some body fields that way. Anything else is rejected.
 */

export interface IntegerOptions {
  min?: number,
  max?: number,
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null;
}

/**
 * A form box the user cleared sends '' (Vue's v-model.number does too). For a
 * field that may be left out, that means "not given", so pass the value through
 * this before an optional check.
 */
export function blankAsMissing(value: unknown): unknown {
  return value === '' ? undefined : value;
}

/** One of a fixed set of strings, such as an action type. */
export function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  if (isMissing(value) || value === '') {
    throw new BadRequestError(`${field} is required`);
  }
  if (!allowed.includes(value as T)) {
    throw new BadRequestError(`${field} must be one of ${allowed.join(', ')}`);
  }
  return value as T;
}

function toInteger(value: unknown, field: string, options: IntegerOptions): number {
  let parsed = Number.NaN;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    parsed = Number(value);
  }

  if (!Number.isSafeInteger(parsed)) {
    throw new BadRequestError(`${field} must be an integer`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new BadRequestError(`${field} must be at least ${options.min}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new BadRequestError(`${field} must be at most ${options.max}`);
  }

  return parsed;
}

export function requiredInteger(value: unknown, field: string, options: IntegerOptions = {}): number {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toInteger(value, field, options);
}

export function optionalInteger(value: unknown, field: string, options: IntegerOptions = {}): number | undefined {
  return isMissing(value) ? undefined : toInteger(value, field, options);
}

/** A planting year, wherever it comes from. */
export function requiredYear(value: unknown, field: string): number {
  return requiredInteger(value, field, { min: 1, });
}

/** The most a TEXT column holds, in bytes. */
export const TEXT_BYTES = 65535;

export interface StringOptions {
  /** In characters, for a VARCHAR(n) column, which counts characters. */
  maxLength?: number,
  /** In UTF-8 bytes, for a TEXT column, which counts bytes. */
  maxBytes?: number,
}

function toCheckedString(value: unknown, field: string, options: StringOptions): string {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string`);
  }
  if (options.maxLength !== undefined && [ ...value, ].length > options.maxLength) {
    throw new BadRequestError(`${field} must be at most ${options.maxLength} characters`);
  }
  if (options.maxBytes !== undefined && Buffer.byteLength(value, 'utf8') > options.maxBytes) {
    throw new BadRequestError(`${field} must be at most ${options.maxBytes} bytes`);
  }

  return value;
}

/** A string with something in it: missing, empty and blank are all "required". */
export function requiredString(value: unknown, field: string, options: StringOptions = {}): string {
  if (isMissing(value) || (typeof value === 'string' && value.trim() === '')) {
    throw new BadRequestError(`${field} is required`);
  }
  return toCheckedString(value, field, options);
}

/** A string that may be left out, or sent as null. An empty string is kept. */
export function optionalString(value: unknown, field: string, options: StringOptions = {}): string | undefined {
  return isMissing(value) ? undefined : toCheckedString(value, field, options);
}

export interface NumberOptions {
  min?: number,
  /** Exclusive: a quantity must be more than nothing. */
  greaterThan?: number,
  max?: number,
}

/** The most an INT column holds. */
export const INT_MAX = 2147483647;

/** A number, which may have a fraction. Numeric strings are accepted, as for integers. */
export function requiredNumber(value: unknown, field: string, options: NumberOptions = {}): number {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toNumber(value, field, options);
}

export function optionalNumber(value: unknown, field: string, options: NumberOptions = {}): number | undefined {
  return isMissing(value) ? undefined : toNumber(value, field, options);
}

function toNumber(value: unknown, field: string, options: NumberOptions): number {
  let parsed = Number.NaN;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
    parsed = Number(value);
  }

  if (!Number.isFinite(parsed)) {
    throw new BadRequestError(`${field} must be a number`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new BadRequestError(`${field} must be at least ${options.min}`);
  }
  if (options.greaterThan !== undefined && parsed <= options.greaterThan) {
    throw new BadRequestError(`${field} must be greater than ${options.greaterThan}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new BadRequestError(`${field} must be at most ${options.max}`);
  }

  return parsed;
}

/** true or false, as JSON booleans; anything else, "yes" or 1 included, is rejected. */
export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (isMissing(value)) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new BadRequestError(`${field} must be true or false`);
  }
  return value;
}

/** A JSON array. Its entries are checked by the caller, which knows what they should be. */
export function requiredList(value: unknown, field: string): unknown[] {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  if (!Array.isArray(value)) {
    throw new BadRequestError(`${field} must be a list`);
  }
  return value;
}

/** A list that may be left out, which is then empty. */
export function optionalList(value: unknown, field: string): unknown[] {
  return isMissing(value) ? [] : requiredList(value, field);
}

/** A JSON object, such as an entry of a list, whose fields are then checked one by one. */
export function requiredObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

/** A nested object that may be left out, which then reads as one with no fields. */
export function optionalObject(value: unknown, field: string): Record<string, unknown> {
  return isMissing(value) ? {} : requiredObject(value, field);
}

/** A date (2026-06-01), or an ISO 8601 timestamp with or without its offset (2026-06-01T17:00:00.000Z). */
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const BARE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A bare date is that day in the service's own time zone, where its dates are
 * written. `new Date('2026-07-01')` would be UTC midnight instead, which is the
 * evening before in America/New_York, and is filed under that day (L7).
 */
function parseDate(value: string): Date {
  const bare = BARE_DATE.exec(value);
  if (!bare) {
    return new Date(value);
  }

  const [ year, month, day, ] = bare.slice(1).map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);

  // Date rolls 2026-02-30 over into March; a day that doesn't exist isn't a date
  return date.getMonth() === month - 1 ? date : new Date(Number.NaN);
}

function toDate(value: unknown, field: string): Date {
  const date = typeof value === 'string' && DATE_FORMAT.test(value) ? parseDate(value) : undefined;

  if (date === undefined || Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${field} must be a date, as YYYY-MM-DD or an ISO 8601 timestamp`);
  }

  return date;
}

interface YearRange {
  min: number,
  max: number,
}

/**
 * A TIMESTAMP column holds 1970-01-01 00:00:01 to 2038-01-19 03:14:07 UTC. The
 * years at either end are left out, so that a date the server shifts into its
 * own time zone still fits.
 */
const TIMESTAMP_YEARS: YearRange = { min: 1971, max: 2037, };

/** The years MySQL supports in a DATE column. Earlier ones may be stored, but aren't promised. */
const DATE_YEARS: YearRange = { min: 1000, max: 9999, };

function toDateIn(value: unknown, field: string, years: YearRange): Date {
  const date = toDate(value, field);
  // the year it is written with: dates are formatted in the service's own zone
  const year = date.getFullYear();

  if (year < years.min || year > years.max) {
    throw new BadRequestError(`${field} must be between ${years.min} and ${years.max}`);
  }

  return date;
}

/** A date for a TIMESTAMP column. */
export function requiredTimestamp(value: unknown, field: string): Date {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toDateIn(value, field, TIMESTAMP_YEARS);
}

/** A date for a DATE column. */
export function requiredDate(value: unknown, field: string): Date {
  if (isMissing(value)) {
    throw new BadRequestError(`${field} is required`);
  }
  return toDateIn(value, field, DATE_YEARS);
}

export function optionalDate(value: unknown, field: string): Date | undefined {
  return isMissing(value) ? undefined : toDateIn(value, field, DATE_YEARS);
}

/** A month and day with no year, as a schedule item's VARCHAR(5) holds it: 05-01. */
const MONTH_DAY = /^(\d{2})-(\d{2})$/;
/** The longest each month can be; 02-29 is allowed, since the year is not known. */
const DAYS_IN_MONTH = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, ];

export function optionalMonthDay(value: unknown, field: string): string | undefined {
  if (isMissing(value)) {
    return undefined;
  }

  const parts = typeof value === 'string' ? MONTH_DAY.exec(value) : null;
  const month = Number(parts?.[1]);
  const day = Number(parts?.[2]);

  if (!parts || month < 1 || month > 12 || day < 1 || day > DAYS_IN_MONTH[month - 1]!) {
    throw new BadRequestError(`${field} must be a month and day, as MM-DD`);
  }

  return value as string;
}

/**
 * The JSON body's fields. Express 5 leaves req.body undefined when no body was
 * sent, so that reads as a body with no fields, and each required one is
 * reported missing.
 */
export function bodyOf(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  return typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
}
