const allHarvestFields = 'harvest_id, planting_id, quantity';

const upsertHarvest: string = `
  INSERT into harvests (harvest_id, planting_id, quantity) VALUES (?,?,?)
  ON DUPLICATE KEY
  UPDATE planting_id = VALUES(planting_id),
         quantity =    VALUES(quantity)
`;

const getById: string = `SELECT ${allHarvestFields} FROM harvests WHERE harvest_id = ?`;

const getAll: string = `SELECT ${allHarvestFields} FROM harvests`;

const getHarvestSummary: string =
  `SELECT p.planting_year, h.planting_id, SUM(h.quantity)
     FROM harvests h
     JOIN plantings p
       ON h.planting_id = p.planting_id
    WHERE p.planting_year = ?
    GROUP BY h.planting_year, h.planting_id`;

const deleteById: string = 'DELETE FROM harvests WHERE harvest_id = ?';

export default {
  upsertHarvest,
  getById,
  getAll,
  getHarvestSummary,
  deleteById,
}
