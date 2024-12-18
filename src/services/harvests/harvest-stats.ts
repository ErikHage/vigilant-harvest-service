import { Harvest, HarvestPlantingStats, HarvestStats } from './types';

const MILLIS_PER_DAY: number = 1000 * 60 * 60 * 24;

function calculate(harvests: Harvest[]): HarvestStats {
  const harvestsByDate: Map<string, Harvest[]> = mapHarvestsToDates(harvests);

  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);
  const plantingStats = calculatePlantingStats(harvests);

  return {
    numberOfHarvests: harvestsByDate.size,
    firstHarvestDate: harvestDates.firstHarvestDate,
    lastHarvestDate: harvestDates.lastHarvestDate,
    numberOfDays,
    plantingStats,
  };
}

function mapHarvestsToDates(harvests: Harvest[]): Map<string, Harvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate.toDateString();

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<string, Harvest[]>());
}

function findFirstAndLast(harvestsByDate: Map<string, Harvest[]>) {
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
  return Math.ceil(diffInMs / MILLIS_PER_DAY);
}

function calculatePlantingStats(harvests: Harvest[]): Map<string,HarvestPlantingStats> {
  return harvests.reduce((harvestPlantingStats, harvest) => {
    const key = harvest.plantingId;

    if (!harvestPlantingStats.has(key)) {
      harvestPlantingStats.set(key, {
        plantingId: key,
      });
    }

    return harvestPlantingStats;
  }, new Map<string, HarvestPlantingStats>());
}

export default {
  calculate,
};
