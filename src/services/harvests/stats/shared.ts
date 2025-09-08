import { HydratedHarvest } from '../types';

const MILLIS_PER_DAY: number = 1000 * 60 * 60 * 24;

export function mapHarvestsToDates(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate.toDateString();

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<string, HydratedHarvest[]>());
}

export function findFirstAndLast(harvestsByDate: Map<string, HydratedHarvest[]>) {
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

export function calculateNumberOfDays(date1: Date | null, date2: Date | null): number {
  if (date1 == null || date2 == null) {
    return 0;
  }

  const diffInMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffInMs / MILLIS_PER_DAY) + 1;
}
