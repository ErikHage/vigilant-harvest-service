const allPlotFields = 'plot_id, length_in_inches, width_in_inches, plot_type, is_active';

const upsertPlot: string = `
  INSERT into plots (plot_id, length_in_inches, width_in_inches, plot_type, is_active)
  VALUES (?,?,?,?,?)
  ON DUPLICATE KEY
  UPDATE length_in_inches = VALUES(length_in_inches),
         width_in_inches =  VALUES(width_in_inches),
         plot_type =        VALUES(plot_type),
         is_active =        VALUES(is_active)
`;

const getById: string = `SELECT ${allPlotFields} FROM plots WHERE plot_id = ?`;

const getAll: string = `SELECT ${allPlotFields} FROM plots`;

const deleteById: string = 'DELETE FROM plots WHERE plot_id = ?';

export default {
  upsertPlot,
  getById,
  getAll,
  deleteById,
}
