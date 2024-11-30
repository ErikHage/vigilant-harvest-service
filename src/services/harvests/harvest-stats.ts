import { Harvest, HarvestStats } from './types';

function calculate(harvests: Harvest[]): HarvestStats {
  const harvestsByDate = mapHarvestsToDates(harvests);

  return {
    numberOfHarvests: Object.keys(harvestsByDate).length,
  };
}

function mapHarvestsToDates(harvests: Harvest[]): Map<string, Harvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate.toISOString();

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<string, Harvest[]>());
}

export default {
  calculate,
};
