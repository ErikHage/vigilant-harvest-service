const allScheduleFields = 'activity_schedule_id, name, description';

const schedules = {
  insert:
    'INSERT INTO activity_schedules (activity_schedule_id, name, description) ' +
    'VALUES (?,?,?)',

  list: `SELECT ${allScheduleFields} FROM activity_schedules`,
};

const scheduleItems = {
  insert:
    'INSERT INTO activity_schedule_items (activity_schedule_id, entry_id, activity_type, sub_type, recurrence_rule, start_date, end_date, notes) ' +
    'VALUES (?,?,?,?,?,?,?,?)',
};

export default {
  schedules,
  scheduleItems,
}
