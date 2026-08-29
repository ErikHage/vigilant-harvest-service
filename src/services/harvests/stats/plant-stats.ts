import { ItemStats, HydratedHarvest } from '../types';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';
import { UNSPECIFIED_HARVEST_TYPE_ID } from '../../harvest-types/types';

function calculate(harvests: HydratedHarvest[]): ItemStats[] {
  const harvestsByPlant: Map<string, HydratedHarvest[]> = mapHarvestsToPlants(harvests);
  return calculatePlantStats(harvestsByPlant);
}

// grouped by plant *and* harvest type: a plant whose default changed mid-season has harvests of
// more than one type, and summing across types would be meaningless
function mapHarvestsToPlants(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByPlant, harvest) => {
    const key = `${harvest.plantId}::${harvest.harvestTypeId}`;

    if (!harvestsByPlant.has(key)) {
      harvestsByPlant.set(key, []);
    }

    harvestsByPlant.get(key)!.push(harvest);

    return harvestsByPlant;
  }, new Map<string, HydratedHarvest[]>());
}

function calculatePlantStats(harvestsByPlant: Map<string, HydratedHarvest[]>): ItemStats[] {
  return Array.from(harvestsByPlant.values()).map(harvests => {
    return calculatePlantStat(harvests);
  });
}

function calculatePlantStat(harvests: HydratedHarvest[]): ItemStats {
  const harvestsByDate = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let totalQuantity = 0;
  harvests.forEach(harvest => {
    totalQuantity += harvest.quantity;
  });

  const plantId = harvests.length > 0 ? harvests[0]!.plantId : 'Unknown';
  const plantName = harvests.length > 0 ? harvests[0]!.plantName : 'Unknown';
  const harvestTypeId = harvests.length > 0 ? harvests[0]!.harvestTypeId : UNSPECIFIED_HARVEST_TYPE_ID;
  const harvestType = harvests.length > 0 ? harvests[0]!.harvestType : 'unspecified';

  return {
    plantId,
    plantName,
    harvestTypeId,
    harvestType,
    totalQuantity,
    averageHarvestPerDay: totalQuantity / numberOfDays,
    firstHarvest: harvestDates.firstHarvestDate,
    lastHarvest: harvestDates.lastHarvestDate,
  };
}

export default {
  calculate,
};
