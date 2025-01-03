import { Planting, PlantingRow } from './types';

const plantings = {
  upsert: {
    toParams: function(planting: Planting): Array<string | number | null> {
      return [
        planting.plantingId,
        planting.plotId,
        planting.plantId,
        planting.numPlants,
        planting.plantingYear,
        planting.name,
        JSON.stringify(planting.notes),
      ];
    },
  },

  fromRow: function(row: PlantingRow): Planting {
    return {
      plantingId: row.planting_id,
      plotId: row.plot_id,
      plantId: row.plant_id,
      numPlants: row.num_plants,
      plantingYear: row.planting_year,
      name: row.planting_name,
      notes: row.notes ? JSON.parse(row.notes) : [],
    };
  },
};

export default {
  plantings,
}
