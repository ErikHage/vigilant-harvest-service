import { ItemStats, HydratedHarvest } from '../types';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';

function calculate(harvests: HydratedHarvest[]): ItemStats[] {
  const harvestsByPlant: Map<string, HydratedHarvest[]> = mapHarvestsToPlants(harvests);
  return calculatePlantStats(harvestsByPlant);
}

function mapHarvestsToPlants(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByPlant, harvest) => {
    const plantId = harvest.plantId;

    if (!harvestsByPlant.has(plantId)) {
      harvestsByPlant.set(plantId, []);
    }

    harvestsByPlant.get(plantId)!.push(harvest);

    return harvestsByPlant;
  }, new Map<string, HydratedHarvest[]>());
}

function calculatePlantStats(harvestsByPlant: Map<string, HydratedHarvest[]>): ItemStats[] {
  return Array.from(harvestsByPlant.entries()).map(([ plantId, harvests, ]) => {
    return calculatePlantStat(plantId, harvests);
  });
}

function calculatePlantStat(plantId: string, harvests: HydratedHarvest[]): ItemStats {
  const harvestsByDate = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let totalQuantity = 0;
  harvests.forEach(harvest => {
    totalQuantity += harvest.quantity;
  });

  const plantName = harvests.length > 0 ? harvests[0]!.plantName : 'Unknown';

  return {
    plantId,
    plantName,
    totalQuantity,
    averageHarvestPerDay: totalQuantity / numberOfDays,
    firstHarvest: harvestDates.firstHarvestDate,
    lastHarvest: harvestDates.lastHarvestDate,
  };
}

export default {
  calculate,
};
