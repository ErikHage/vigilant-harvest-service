import { HarvestPlantingStats, HydratedHarvest } from '../types';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';

function calculate(harvests: HydratedHarvest[]) {
  const harvestsByPlanting: Map<string, HydratedHarvest[]> = mapHarvestsToPlantings(harvests);
  return calculatePlantingStats(harvestsByPlanting);
}

function mapHarvestsToPlantings(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByPlanting, harvest) => {
    const plantingId = harvest.plantingId;

    if (!harvestsByPlanting.has(plantingId)) {
      harvestsByPlanting.set(plantingId, []);
    }

    harvestsByPlanting.get(plantingId)!.push(harvest);

    return harvestsByPlanting;
  }, new Map<string, HydratedHarvest[]>());
}

function calculatePlantingStats(harvestsByPlanting: Map<string, HydratedHarvest[]>): Map<string, HarvestPlantingStats> {
  const result = new Map<string, HarvestPlantingStats>();

  for (const plantingId of harvestsByPlanting.keys()) {
    result.set(plantingId, calculatePlantingStat(plantingId, harvestsByPlanting.get(plantingId)!))
  }

  return result;
}

function calculatePlantingStat(plantingId: string, harvests: HydratedHarvest[]): HarvestPlantingStats {
  const harvestsByDate = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let totalQuantity = 0;
  harvests.forEach(harvest => {
    totalQuantity += harvest.quantity;
  });

  const plantName = harvests.length > 0 ? harvests[0]!.plantName : 'Unknown';

  return {
    plantingId,
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
