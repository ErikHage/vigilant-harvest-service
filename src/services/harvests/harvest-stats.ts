import { Harvest, HarvestPlantingStats, HarvestStats } from './types';

const MILLIS_PER_DAY: number = 1000 * 60 * 60 * 24;

function calculate(harvests: Harvest[]): HarvestStats {
  const harvestsByDate: Map<string, Harvest[]> = mapHarvestsToDates(harvests);
  const harvestsByPlanting: Map<string, Harvest[]> = mapHarvestsToPlantings(harvests);

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

function mapHarvestsToPlantings(harvests: Harvest[]): Map<string, Harvest[]> {
  return harvests.reduce((harvestsByPlanting, harvest) => {
    const plantingId = harvest.plantingId;

    if (!harvestsByPlanting.has(plantingId)) {
      harvestsByPlanting.set(plantingId, []);
    }

    harvestsByPlanting.get(plantingId)!.push(harvest);

    return harvestsByPlanting;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculatePlantingStats(harvestsByPlanting: Map<string, Harvest[]>): Map<string,HarvestPlantingStats> {
  // todo
  return new Map<string, HarvestPlantingStats>();
}

export default {
  calculate,
};
