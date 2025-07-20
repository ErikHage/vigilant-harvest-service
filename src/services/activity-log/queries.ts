const allFields =
  'entry_id, planting_year, entry_date, activity_type, sub_type, comments, date_created, date_modified';


const activityLogEntries = {
    upsert: `
      INSERT into garden_activity_log (entry_id, planting_year, entry_date, activity_type, sub_type, comments)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        planting_year =    VALUES(planting_year),
        entry_date =       VALUES(entry_date),
        activity_type =    VALUES(activity_type),
        sub_type =         VALUES(sub_type),
        comments =         VALUES(comments)
    `,
    getByEntryId: `SELECT ${allFields} FROM garden_activity_log WHERE entry_id = ?`,
    getByYear: `SELECT ${allFields} FROM garden_activity_log WHERE planting_year = ?`,
};

export default {
  activityLogEntries,
}
