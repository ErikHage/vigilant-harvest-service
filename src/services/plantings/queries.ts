import { PlantingUpdate } from './types';

const allPlantingFields: string =
  `p.planting_id,
p.plot_id,
p.plant_id,
p.current_planting_year,
p.planting_name,
p.seed_source,
p.lot_number,
p.lead_time_weeks,
p.sow_date,
p.sow_type,
p.number_sown,
p.transplant_date,
p.number_transplanted,
p.current_status,
p.notes,
p.date_created,
p.date_modified
`;

const allPlantingHistoryFields: string =
  `planting_history_id,
planting_id,
planting_status,
comment,
date_created,
date_modified
`;

const plantings = {
  insert: `
    INSERT into plantings (planting_id,
                           plant_id,
                           current_planting_year,
                           planting_name,
                           seed_source,
                           lot_number,
                           lead_time_weeks,
                           current_status,
                           notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  clone: `
    INSERT INTO plantings (planting_id,
                           plot_id,
                           plant_id,
                           lead_time_weeks,
                           sow_date,
                           sow_type,
                           number_sown,
                           transplant_date,
                           current_status,
                           number_transplanted,
                           current_planting_year,
                           planting_name,
                           seed_source,
                           lot_number,
                           notes)
    SELECT ?, -- new planting_id
           plot_id,
           plant_id,
           lead_time_weeks,
           sow_date,
           sow_type,
           number_sown,
           transplant_date,
           current_status,
           number_transplanted,
           current_planting_year,
           ?, -- new planting_name
           seed_source,
           lot_number,
           notes
    FROM plantings
    WHERE planting_id = ? -- existing planting_id to copy
  `,

  buildUpdateQuery(plantingUpdate: PlantingUpdate): string {
    const queryParts: string[] = [
      'current_status = ?',
    ];

    if (plantingUpdate.name) queryParts.push('planting_name = ?');
    if (plantingUpdate.plantId) queryParts.push('plant_id = ?');
    if (plantingUpdate.seedSource) queryParts.push('seed_source = ?');
    if (plantingUpdate.lotNumber) queryParts.push('lot_number = ?');
    if (plantingUpdate.plotId) queryParts.push('plot_id = ?');
    if (plantingUpdate.leadTimeWeeks) queryParts.push('lead_time_weeks = ?');
    if (plantingUpdate.numberSown) queryParts.push('number_sown = ?');
    if (plantingUpdate.sowDate) queryParts.push('sow_date = ?');
    if (plantingUpdate.sowType) queryParts.push('sow_type = ?');
    if (plantingUpdate.transplantDate) queryParts.push('transplant_date = ?');
    if (plantingUpdate.numberTransplanted) queryParts.push('number_transplanted = ?');
    if (plantingUpdate.notes) queryParts.push('notes = ?');

    return `UPDATE plantings
            SET ${queryParts.join(', ')}
            WHERE planting_id = ?`;
  },

  getById: `SELECT ${allPlantingFields}
            FROM plantings p
            WHERE planting_id = ?`,

  getByYear: `SELECT ${allPlantingFields}
              FROM plantings p
              JOIN planting_planting_years ppy
                ON ppy.planting_id = p.planting_id
              WHERE ppy.planting_year = ?`,

  getAll: `SELECT ${allPlantingFields}
           FROM plantings p`,

  getStatusBreakdowns: `SELECT current_planting_year,
                               current_status AS planting_status,
                               count(*) AS status_count
                          FROM plantings
                         GROUP BY current_planting_year, current_status`,

  deleteById: 'DELETE FROM plantings WHERE planting_id = ?',
};

const yearMapping = {
  insert: 'INSERT INTO planting_planting_years (planting_id, planting_year) ' +
    'VALUES (?, ?)',

  clone: `
    INSERT INTO planting_planting_years (planting_id, planting_year)
    SELECT ?, -- new planting_id
           planting_year
    FROM planting_planting_years
    WHERE planting_id = ? -- original planting_id'`,

  getById: `
    SELECT planting_id, planting_year
      FROM planting_planting_years
     WHERE planting_id = (?)`,
};

const plantingStatusHistory = {
  insert: `
    INSERT INTO planting_status_history (planting_id, planting_status, \`comment\`)
    VALUES (?, ?, ?)
  `,

  clone: `
    INSERT INTO planting_status_history (planting_id,
                                         planting_status,
                                         comment)
    SELECT ?, -- new planting_id
           planting_status,
           comment
    FROM planting_status_history
    WHERE planting_id = ? -- original planting_id
  `,

  getByPlantingId: `SELECT ${allPlantingHistoryFields}
                    FROM planting_status_history
                    WHERE planting_id = ?`,
};

export default {
  plantings,
  yearMapping,
  plantingStatusHistory,
}
