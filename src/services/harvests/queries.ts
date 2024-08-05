const insertHarvest: string = 'INSERT into harvests (harvest_id, planting_id, quantity) VALUES (?,?,?)';

const getHarvestSummary: string =
  `SELECT p.planting_year, h.planting_id, SUM(h.quantity) as quantity
     FROM harvests h
     JOIN plantings p
       ON h.planting_id = p.planting_id
    WHERE p.planting_year = ?
    GROUP BY p.planting_year, h.planting_id`;

const deleteById: string = 'DELETE FROM harvests WHERE harvest_id = ?';

export default {
  insertHarvest,
  getHarvestSummary,
  deleteById,
}
