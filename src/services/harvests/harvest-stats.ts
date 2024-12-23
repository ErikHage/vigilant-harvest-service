import { HarvestPlantingStats, HarvestStats, HydratedHarvest } from './types';

const MILLIS_PER_DAY: number = 1000 * 60 * 60 * 24;

function calculate(harvests: HydratedHarvest[]): HarvestStats {
  const harvestsByDate: Map<string, HydratedHarvest[]> = mapHarvestsToDates(harvests);
  const harvestsByPlanting: Map<string, HydratedHarvest[]> = mapHarvestsToPlantings(harvests);

  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);
  const plantingStats = calculatePlantingStats(harvestsByPlanting);

  return {
    numberOfHarvests: harvestsByDate.size,
    firstHarvestDate: harvestDates.firstHarvestDate,
    lastHarvestDate: harvestDates.lastHarvestDate,
    numberOfDays,
    plantingStats,
  };
}

function mapHarvestsToDates(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate.toDateString();

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<string, HydratedHarvest[]>());
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

function findFirstAndLast(harvestsByDate: Map<string, HydratedHarvest[]>) {
  const dates: Date[] = Array.from(harvestsByDate.keys()).map(d => new Date(d));

  if (dates.length === 0) {
    return {
      firstHarvestDate: null,
      lastHarvestDate: null,
    };
  }

  const earliest = new Date(Math.min(...dates.map(date => date.getTime())));
  const latest = new Date(Math.max(...dates.map(date => date.getTime())));

  return {
    firstHarvestDate: earliest,
    lastHarvestDate: latest,
  };
}

function calculateNumberOfDays(date1: Date | null, date2: Date | null): number {
  if (date1 == null || date2 == null) {
    return 0;
  }

  const diffInMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffInMs / MILLIS_PER_DAY) + 1;
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
