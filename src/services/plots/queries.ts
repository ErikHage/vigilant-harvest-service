const allPlotFields = 'plot_id, friendly_name, length_in_inches, width_in_inches, plot_type, is_active';

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

export default {
  plots,
}
