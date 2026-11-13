const allScheduleFields = 'activity_schedule_id, name, description';

const allScheduleItemFields = 'activity_schedule_id, entry_id, activity_type, sub_type, recurrence_rule, start_date, start_date_year_offset, end_date, end_date_year_offset, notes';

const schedules = {
  insert:
    'INSERT INTO activity_schedules (activity_schedule_id, name, description) ' +
    'VALUES (?,?,?)',

  list:
    `SELECT ${allScheduleFields} ` +
    '  FROM activity_schedules ',

  getById:
    `SELECT ${allScheduleFields} ` +
    '  FROM activity_schedules ' +
    ' WHERE activity_schedule_id = ?',

  /** Sets each of `columns`, in order, then takes the schedule's id. */
  buildUpdate: (columns: string[]): string =>
    `UPDATE activity_schedules
        SET ${columns.map(column => `${column} = ?`).join(', ')}
      WHERE activity_schedule_id = ?`,

  // activity_schedule_items and plants_activity_schedules cascade on delete
  delete:
    'DELETE FROM activity_schedules WHERE activity_schedule_id = ?',
};

const scheduleItems = {
  insert:
    'INSERT INTO activity_schedule_items (' +
    '       activity_schedule_id, entry_id, activity_type, sub_type, recurrence_rule, ' +
    '       start_date, start_date_year_offset, end_date, end_date_year_offset, notes) ' +
    'VALUES (?,?,?,?,?,?,?,?,?,?)',

  getByEntryId:
    `SELECT ${allScheduleItemFields} ` +
    '  FROM activity_schedule_items ' +
    ' WHERE entry_id = ?',

  getByActivityScheduleId:
    `SELECT ${allScheduleItemFields} ` +
    '  FROM activity_schedule_items ' +
    ' WHERE activity_schedule_id = ?',

  /** Sets each of `columns`, in order, then takes the schedule's id and the item's: it must be on that schedule. */
  buildUpdate: (columns: string[]): string =>
    `UPDATE activity_schedule_items
        SET ${columns.map(column => `${column} = ?`).join(', ')}
      WHERE activity_schedule_id = ?
        AND entry_id = ?`,

  countOnSchedule:
    'SELECT COUNT(*) AS count ' +
    '  FROM activity_schedule_items ' +
    ' WHERE activity_schedule_id = ? ' +
    '   AND entry_id = ?',

  delete:
    'DELETE ' +
    '  FROM activity_schedule_items ' +
    ' WHERE activity_schedule_id = ? ' +
    '   AND entry_id = ?',
};

export default {
  schedules,
  scheduleItems,
}
