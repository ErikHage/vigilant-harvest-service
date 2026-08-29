import { ItemStats, HydratedHarvest } from '../types';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';
import { UNSPECIFIED_HARVEST_TYPE_ID } from '../../harvest-types/types';

function calculate(harvests: HydratedHarvest[]): ItemStats[] {
  const harvestsByPlanting: Map<string, HydratedHarvest[]> = mapHarvestsToPlantings(harvests);
  return calculatePlantingStats(harvestsByPlanting);
}

// grouped by planting *and* harvest type: a planting can hold harvests of more than one type once
// its plant's default has changed, and summing across types would be meaningless
function mapHarvestsToPlantings(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByPlanting, harvest) => {
    const plantingId = harvest.plantingId!; // only optional to share logic with plant stats, will be defined
    const key = `${plantingId}::${harvest.harvestTypeId}`;

    if (!harvestsByPlanting.has(key)) {
      harvestsByPlanting.set(key, []);
    }

    harvestsByPlanting.get(key)!.push(harvest);

    return harvestsByPlanting;
  }, new Map<string, HydratedHarvest[]>());
}

function calculatePlantingStats(harvestsByPlanting: Map<string, HydratedHarvest[]>): ItemStats[] {
  return Array.from(harvestsByPlanting.values()).map(harvests => {
    return calculatePlantingStat(harvests);
  });
}

function calculatePlantingStat(harvests: HydratedHarvest[]): ItemStats {
  const harvestsByDate = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let totalQuantity = 0;
  harvests.forEach(harvest => {
    totalQuantity += harvest.quantity;
  });

  const plantingId = harvests.length > 0 ? harvests[0]!.plantingId : 'Unknown';
  const plantId = harvests.length > 0 ? harvests[0]!.plantId : 'Unknown';
  const plantName = harvests.length > 0 ? harvests[0]!.plantName : 'Unknown';
  const plantingName = harvests.length > 0 ? harvests[0]!.plantingName : 'Unknown';
  const plotName = harvests.length > 0 ? harvests[0]!.plotName : 'Unknown';
  const harvestTypeId = harvests.length > 0 ? harvests[0]!.harvestTypeId : UNSPECIFIED_HARVEST_TYPE_ID;
  const harvestType = harvests.length > 0 ? harvests[0]!.harvestType : 'unspecified';

  return {
    plantingId,
    plantingName,
    plantId,
    plantName,
    plotName,
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
