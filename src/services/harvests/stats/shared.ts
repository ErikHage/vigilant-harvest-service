import { HydratedHarvest } from '../types';
import { daysBetween } from '../../../util/local-dates';

/** Harvests by the day they fall on, YYYY-MM-DD. */
/** The harvests' quantities added up. Each is to the hundredth, so the total is rounded to one too. */
export function totalQuantity(harvests: HydratedHarvest[]): number {
  const total = harvests.reduce((sum, harvest) => sum + harvest.quantity, 0);

  return Math.round(total * 100) / 100;
}

export function mapHarvestsToDates(harvests: HydratedHarvest[]): Map<string, HydratedHarvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate;

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<string, HydratedHarvest[]>());
}

/** The first and last of the days, which sort as strings because they are YYYY-MM-DD. */
export function findFirstAndLast(harvestsByDate: Map<string, HydratedHarvest[]>) {
  const dates = Array.from(harvestsByDate.keys()).sort();

  return {
    firstHarvestDate: dates[0] ?? null,
    lastHarvestDate: dates[dates.length - 1] ?? null,
  };
}

/** The calendar days from the first to the last, both counted; a clock change in between doesn't add one. */
export function calculateNumberOfDays(first: string | null, last: string | null): number {
  if (first == null || last == null) {
    return 0;
  }

  return Math.abs(daysBetween(first, last)) + 1;
}
