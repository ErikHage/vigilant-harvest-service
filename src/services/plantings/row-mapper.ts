import { Planting, PlantingRow } from './types';

const plantings = {
  upsert: {
    toParams: function(planting: Planting): Array<string | number> {
      return [
        planting.plantingId,
        planting.plantId,
        planting.numPlants,
      ];
    },
  },

  fromRow: function(row: PlantingRow): Planting {
    return {
      plantingId: row.planting_id,
      plantId: row.plant_id,
      numPlants: row.num_plants,
      coordinates: [], // todo this
    };
  },
};

export default {
  plantings,
}
