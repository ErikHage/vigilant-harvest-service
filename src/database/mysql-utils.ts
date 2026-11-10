/**
 * A DATETIME as the API returns it: the wall-clock value it holds, with a T in
 * place of MySQL's space. That is formatting, not a conversion; there is no zone.
 */
function toApiDateTime(value: string): string {
  return value.replace(' ', 'T');
}

/**
 * An audit TIMESTAMP as the API returns it. Every service connection reads in
 * UTC (see mysql-connection), so the value is the UTC instant it holds, to the
 * second: YYYY-MM-DDTHH:mm:ssZ.
 */
function toApiAuditTimestamp(value: string): string {
  return `${toApiDateTime(value)}Z`;
}

function booleanToDbInt(val: boolean): number {
  return val ? 1 : 0;
}

function nullableBooleanToDbInt(val?: boolean): number | null {
  if (val === undefined) {
    return null;
  }
  return val ? 1 : 0;
}

function dbIntToBoolean(val: number): boolean {
  return val === 1;
}

export default {
  toApiDateTime,
  toApiAuditTimestamp,
  booleanToDbInt,
  nullableBooleanToDbInt,
  dbIntToBoolean,
}
