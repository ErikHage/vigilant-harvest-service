function dbDateStringToJsDate(dateString: string, stripUtc = false): Date {
  if (stripUtc) {
    const [ year, month, day, ] = dateString.split('-').map(Number);
    return new Date(year!, month! - 1, day);
  } else {
    return new Date(dateString);
  }
}

function nullableDbDateStringToJsDate(dateString: string, stripUtc = false): Date | null {
  if (!dateString) {
    return null;
  }
  return dbDateStringToJsDate(dateString, stripUtc);
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
  dbDateStringToJsDate,
  nullableDbDateStringToJsDate,
  booleanToDbInt,
  nullableBooleanToDbInt,
  dbIntToBoolean,
}
