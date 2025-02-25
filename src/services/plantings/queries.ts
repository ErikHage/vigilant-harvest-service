import { PlantingUpdate } from './types';

const allPlantingFields: string =
`planting_id,
plot_id,
plant_id,
planting_year,
planting_name,
seed_source,
lot_number,
lead_time_weeks,
sow_date,
sow_type,
number_sown,
transplant_date,
number_transplanted,
current_status,
notes,
date_created,
date_modified
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
    INSERT into plantings (
        planting_id,
        plant_id,
        planting_year,
        planting_name,
        seed_source,
        lot_number,
        lead_time_weeks,
        current_status,
        notes)
    VALUES (?,?,?,?,?,?,?,?,?)`,

  buildUpdateQuery(plantingUpdate: PlantingUpdate): string {
    const queryParts: string[] = [
      'current_status = ?',
    ];

    if (plantingUpdate.plotId) queryParts.push('plot_id = ?');
    if (plantingUpdate.numberSown) queryParts.push('number_sown = ?');
    if (plantingUpdate.sowDate) queryParts.push('sow_date = ?');
    if (plantingUpdate.sowType) queryParts.push('sow_type = ?');
    if (plantingUpdate.transplantDate) queryParts.push('transplant_date = ?');
    if (plantingUpdate.numberTransplanted) queryParts.push('number_transplanted = ?');

    return `UPDATE plantings SET  ${queryParts.join(', ')} WHERE planting_id = ?`;
  },

  getById: `SELECT ${allPlantingFields} FROM plantings WHERE planting_id = ?`,

  getByYear: `SELECT ${allPlantingFields} FROM plantings WHERE planting_year = ?`,

  getAll: `SELECT ${allPlantingFields} FROM plantings`,

  deleteById: 'DELETE FROM plantings WHERE planting_id = ?',
};

const plantingStatusHistory = {
  insert: `
    INSERT INTO planting_status_history (planting_id, planting_status, \`comment\`)
    VALUES (?,?,?)
  `,

  getByPlantingId: `SELECT ${allPlantingHistoryFields} FROM planting_status_history WHERE planting_id = ?`,
};

export default {
  plantings,
  plantingStatusHistory,
}
