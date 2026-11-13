const allPlotFields = 'plot_id, friendly_name, length_in_inches, width_in_inches, plot_type, is_active';

const plots = {
    // a name another plot holds is a duplicate entry, never an overwrite
    insert: `
      INSERT INTO plots (plot_id, friendly_name, length_in_inches, width_in_inches, plot_type, is_active)
      VALUES (?,?,?,?,?,?)
    `,
    update: `
      UPDATE plots
         SET friendly_name = ?,
             length_in_inches = ?,
             width_in_inches = ?,
             plot_type = ?,
             is_active = ?
       WHERE plot_id = ?
    `,
    countById: 'SELECT COUNT(*) AS count FROM plots WHERE plot_id = ?',
    countByFriendlyName: 'SELECT COUNT(*) AS count FROM plots WHERE friendly_name = ?',
    getById: `SELECT ${allPlotFields} FROM plots WHERE plot_id = ?`,
    getAll: `SELECT ${allPlotFields} FROM plots`,
    countPlantingsByPlotId: 'SELECT COUNT(*) AS count FROM plantings WHERE plot_id = ?',
    deleteById: 'DELETE FROM plots WHERE plot_id = ?',
};

export default {
  plots,
}
