const insertHarvest: string = 'INSERT into harvests (harvest_id, planting_id, quantity, date_created) VALUES (?,?,?,?)';

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
    WHERE p.planting_year = ?
   ORDER BY h.date_created DESC
  `;

const deleteById: string = 'DELETE FROM harvests WHERE harvest_id = ?';

export default {
  insertHarvest,
  getHarvestSummary,
  searchHarvests,
  deleteById,
}
