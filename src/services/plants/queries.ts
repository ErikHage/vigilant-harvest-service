const allPlantFields = 'plant_id, family, genus, species, friendly_name';

const upsertPlant: string = `
  INSERT into plants (plant_id, family, genus, species, friendly_name) VALUES (?,?,?,?,?)
  ON DUPLICATE KEY
  UPDATE family =        VALUES(family),
         genus =         VALUES(genus),
         species =       VALUES(species),
         friendly_name = VALUES(friendly_name)
`;

const getById: string = `SELECT ${allPlantFields} FROM plants WHERE plant_id = ?`;

const getAll: string = `SELECT ${allPlantFields} FROM plants`;

const deleteById: string = 'DELETE FROM plants WHERE plant_id = ?';

export default {
  upsertPlant,
  getById,
  getAll,
  deleteById,
}
