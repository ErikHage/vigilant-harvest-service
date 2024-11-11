const upsertHarvest: string =
  `INSERT INTO harvests (harvest_id, planting_id, quantity, date_created)
   VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY
       UPDATE planting_id = VALUES(planting_id),
              quantity = VALUES(quantity),
              date_created = VALUES(date_created)`;

const getHarvestByPlantingIdAndDate: string =
  `SELECT harvest_id, planting_id, quantity, date_created
     FROM harvests
    WHERE planting_id = ?
      AND date_created = ?`;

const getHarvestSummary: string =
  `SELECT p.planting_year, h.planting_id, SUM(h.quantity) as quantity
     FROM harvests h
     JOIN plantings p
       ON h.planting_id = p.planting_id
    WHERE p.planting_year = ?
    GROUP BY p.planting_year, h.planting_id`;

const searchHarvests: string =
  `SELECT h.harvest_id, h.planting_id, h.quantity, h.date_created
     FROM harvests h
     JOIN plantings p
       ON h.planting_id = p.planting_id
    WHERE p.planting_year = ?
   ORDER BY h.date_created DESC`;

const deleteById: string = 'DELETE FROM harvests WHERE harvest_id = ?';

export default {
  upsertHarvest,
  getHarvestByPlantingIdAndDate,
  getHarvestSummary,
  searchHarvests,
  deleteById,
}
