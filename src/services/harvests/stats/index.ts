import { ItemStats, HarvestStats, HydratedHarvest } from '../types';
import { StatsType } from '../../../types/stats-type';
import { mapHarvestsToDates, findFirstAndLast, calculateNumberOfDays } from './shared';
import plantingStats from './planting-stats';
import plantStats from './plant-stats';

function calculate(harvests: HydratedHarvest[], statsType: StatsType): HarvestStats {
  const harvestsByDate: Map<string, HydratedHarvest[]> = mapHarvestsToDates(harvests);
  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  let stats: ItemStats[];
  if (statsType === StatsType.Planting) {
    stats = plantingStats.calculate(harvests);
  } else { // statsType is guaranteed to be StatsType.Plant here
    stats = plantStats.calculate(harvests);
  }

  return {
    numberOfHarvests: harvestsByDate.size,
    firstHarvestDate: harvestDates.firstHarvestDate,
    lastHarvestDate: harvestDates.lastHarvestDate,
    numberOfDays,
    statsType,
    stats,
  };
}

export default {
  calculate,
};
