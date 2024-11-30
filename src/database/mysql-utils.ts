import { format } from 'date-fns'

const mysqlFormat = 'yyyy-MM-dd HH:mm:ss';

function dateToDbString(date: Date) {
  return format(date, mysqlFormat);
}

function dbDateStringToJsDate(dateString: string): Date {
  return new Date(dateString);
}

function booleanToDbInt(val: boolean): number {
  return val ? 1 : 0;
}

function dbIntToBoolean(val: number): boolean {
  return val === 1;
}

export default {
  dateToDbString,
  dbDateStringToJsDate,
  booleanToDbInt,
  dbIntToBoolean,
}
