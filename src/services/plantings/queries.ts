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

const plantings = {
  upsert: `
    INSERT into plantings (
        planting_id, plot_id, plant_id, planting_year, planting_name, seed_source, lot_number, lead_time_weeks,
        sow_date, sow_type, number_sown, transplant_date, number_transplanted, current_status, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY
    UPDATE plot_id = VALUES(plot_id),
           plant_id = VALUES(plant_id),
           planting_year = VALUES(planting_year),
           planting_name = VALUES(planting_name),
           seed_source = VALUES(seed_source),
           lot_number = VALUES(lot_number),
           lead_time_weeks = VALUES(lead_time_weeks),
           sow_date = VALUES(sow_date),
           sow_type = VALUES(sow_type),
           number_sown = VALUES(number_sown),
           transplant_date = VALUES(transplant_date),
           number_transplanted = VALUES(number_transplanted),
           current_status = VALUES(current_status),
           notes = VALUES(notes)`,

  getById: `SELECT ${allPlantingFields} FROM plantings WHERE planting_id = ?`,

  getByYear: `SELECT ${allPlantingFields} FROM plantings WHERE planting_year = ?`,

  getAll: `SELECT ${allPlantingFields} FROM plantings`,

  deleteById: 'DELETE FROM plantings WHERE plant_id = ?',
};

export default {
  plantings,
}
