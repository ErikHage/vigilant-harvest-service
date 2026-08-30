const allHarvestFields: string =
  'h.harvest_id, h.planting_id, h.quantity, h.date_created, h.harvest_type_id, ht.harvest_type_name';

const harvestTypeJoin: string =
  `JOIN harvest_types ht
       ON ht.harvest_type_id = h.harvest_type_id`;

// the service resolves the authoritative harvest_type_id before this runs -- the requested one, or
// the type already stored, or the plant's default -- so the UPDATE clause writes it back as given
const upsertHarvest: string =
  `INSERT INTO harvests (harvest_id, planting_id, quantity, date_created, harvest_type_id)
   VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY
       UPDATE planting_id = VALUES(planting_id),
              quantity = VALUES(quantity),
              date_created = VALUES(date_created),
              harvest_type_id = VALUES(harvest_type_id)`;

const getHarvestById: string =
  `SELECT ${allHarvestFields}
     FROM harvests h
     ${harvestTypeJoin}
    WHERE h.harvest_id = ?`;

const getHarvestByPlantingIdDateAndType: string =
  `SELECT ${allHarvestFields}
     FROM harvests h
     ${harvestTypeJoin}
    WHERE h.planting_id = ?
      AND h.date_created = ?
      AND h.harvest_type_id = ?`;

const getDefaultHarvestTypeIdByPlantingId: string =
  `SELECT pl.default_harvest_type_id
     FROM plantings p
     JOIN plants pl
       ON p.plant_id = pl.plant_id
    WHERE p.planting_id = ?`;

const getHarvestSummary: string =
  `SELECT h.planting_year, h.planting_id, h.harvest_type_id, ht.harvest_type_name, SUM(h.quantity) as quantity
     FROM harvests h
     ${harvestTypeJoin}
    WHERE h.planting_year = ?
    GROUP BY h.planting_year, h.planting_id, h.harvest_type_id, ht.harvest_type_name`;

const searchHarvests: string =
  `SELECT ${allHarvestFields}
     FROM harvests h
     ${harvestTypeJoin}
    WHERE h.planting_year = ?
   ORDER BY h.date_created DESC`;

const getHydratedHarvestsByYear: string =
  `SELECT h.harvest_id, h.planting_id, p.planting_name, pl.plant_id, pt.friendly_name as plot_name,
          pl.friendly_name AS plant_name, h.quantity, h.date_created,
          h.harvest_type_id, ht.harvest_type_name
     FROM harvests h
     JOIN plantings p
       ON h.planting_id = p.planting_id
     JOIN plants pl
       ON p.plant_id = pl.plant_id
     Join plots pt
       ON p.plot_id = pt.plot_id
     ${harvestTypeJoin}
    WHERE h.planting_year = ?
   ORDER BY h.date_created DESC`;

const deleteById: string = 'DELETE FROM harvests WHERE harvest_id = ?';

export default {
  upsertHarvest,
  getHarvestById,
  getHarvestByPlantingIdDateAndType,
  getDefaultHarvestTypeIdByPlantingId,
  getHarvestSummary,
  searchHarvests,
  getHydratedHarvestsByYear,
  deleteById,
}
