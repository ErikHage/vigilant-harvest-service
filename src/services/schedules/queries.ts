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

  update:
    'UPDATE activity_schedules ' +
    '   SET name = ?, ' +
    '       description = ? ' +
    ' WHERE activity_schedule_id = ?',
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

  update:
    'UPDATE activity_schedule_items ' +
    '   SET activity_type = ?, ' +
    '       sub_type = ?, ' +
    '       recurrence_rule = ?, ' +
    '       start_date = ?, ' +
    '       start_date_year_offset = ?, ' +
    '       end_date = ?, ' +
    '       end_date_year_offset = ?, ' +
    '       notes = ? ' +
    ' WHERE entry_id = ?',

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
