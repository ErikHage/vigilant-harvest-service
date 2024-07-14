const allPlotFields = 'plot_id, friendly_name, length_in_inches, width_in_inches, plot_type, is_active';
const allPlotYearFields = 'plot_year_id, plot_id, num_rows, num_columns, year';

const plots = {
    upsert: `
      INSERT into plots (plot_id, friendly_name, length_in_inches, width_in_inches, plot_type, is_active)
      VALUES (?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        friendly_name =    VALUES(friendly_name),
        length_in_inches = VALUES(length_in_inches),
        width_in_inches =  VALUES(width_in_inches),
        plot_type =        VALUES(plot_type),
        is_active =        VALUES(is_active)
    `,
    getById: `SELECT ${allPlotFields} FROM plots WHERE plot_id = ?`,
    getAll: `SELECT ${allPlotFields} FROM plots`,
    deleteById: 'DELETE FROM plots WHERE plot_id = ?',
};

const plotYears = {
  upsert: `
      INSERT into plot_years (plot_year_id, plot_id, num_rows, num_columns, year)
      VALUES (?,?,?,?,?)
      ON DUPLICATE KEY
      UPDATE plot_id =     VALUES(plot_id),
             num_rows =    VALUES(num_rows),
             num_columns = VALUES(num_columns),
             year =        VALUES(year)`,
  getById: `SELECT ${allPlotYearFields} FROM plot_years WHERE plot_year_id = ?`,
  getAll: `SELECT ${allPlotYearFields} FROM plot_years`,
  deleteById: 'DELETE FROM plot_years WHERE plot_year_id = ?',
};

export default {
  plots,
  plotYears,
}
