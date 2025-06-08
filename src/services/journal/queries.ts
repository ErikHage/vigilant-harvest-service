const allFields = 'entry_id, planting_year, entry, entry_date, date_created, date_modified';

const journalEntries = {
    upsert: `
      INSERT into garden_journal (entry_id, planting_year, entry, entry_date)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        planting_year =    VALUES(planting_year),
        entry =            VALUES(entry),
        entry_date =       VALUES(entry_date),
    `,
    getByEntryId: `SELECT ${allFields} FROM garden_journal WHERE entry_id = ?`,
    getByYear: `SELECT ${allFields} FROM garden_journal WHERE planting_year = ?`,
};

export default {
  journalEntries,
}
