import { ItemStats, HydratedHarvest } from '../types';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';

function calculate(harvests: HydratedHarvest[]): ItemStats[] {
  const harvestsByPlanting: Map<string, HydratedHarvest[]> = mapHarvestsToPlantings(harvests);
  return calculatePlantingStats(harvestsByPlanting);
}

function mapHarvestsToPlantings(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByPlanting, harvest) => {
    const plantingId = harvest.plantingId!; // only optional to share logic with plant stats, will be defined

    if (!harvestsByPlanting.has(plantingId)) {
      harvestsByPlanting.set(plantingId, []);
    }

    harvestsByPlanting.get(plantingId)!.push(harvest);

    return harvestsByPlanting;
  }, new Map<string, HydratedHarvest[]>());
}

function calculatePlantingStats(harvestsByPlanting: Map<string, HydratedHarvest[]>): ItemStats[] {
  return Array.from(harvestsByPlanting.entries()).map(([ plantingId, harvests, ]) => {
    return calculatePlantingStat(plantingId, harvests);
  });
}

function calculatePlantingStat(plantingId: string, harvests: HydratedHarvest[]): ItemStats {
  const harvestsByDate = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let totalQuantity = 0;
  harvests.forEach(harvest => {
    totalQuantity += harvest.quantity;
  });

  const plantId = harvests.length > 0 ? harvests[0]!.plantId : 'Unknown';
  const plantName = harvests.length > 0 ? harvests[0]!.plantName : 'Unknown';
  const plantingName = harvests.length > 0 ? harvests[0]!.plantingName : 'Unknown';
  const plotName = harvests.length > 0 ? harvests[0]!.plotName : 'Unknown';

  return {
    plantingId,
    plantingName,
    plantId,
    plantName,
    plotName,
    totalQuantity,
    averageHarvestPerDay: totalQuantity / numberOfDays,
    firstHarvest: harvestDates.firstHarvestDate,
    lastHarvest: harvestDates.lastHarvestDate,
  };
}

export default {
  calculate,
};
