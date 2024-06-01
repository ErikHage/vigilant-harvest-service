import { Planting, PlantingRow, PlotPlanting, PlotPlantingRow } from './types';

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
      coordinates: [],
    };
  },
};

const plotPlantings = {
  insert: {
    toParams: function(plotPlanting: PlotPlanting): Array<string | number> {
      return [
        plotPlanting.plotYearId,
        plotPlanting.plantingId,
        plotPlanting.xCoordinate,
        plotPlanting.yCoordinate,
      ];
    },
  },

  fromRow: function(row: PlotPlantingRow): PlotPlanting {
    return {
      plotYearId: row.plot_year_id,
      plantingId: row.planting_id,
      xCoordinate: row.x_coordinate,
      yCoordinate: row.y_coordinate,
    };
  },
};

export default {
  plantings,
  plotPlantings,
}
