import { Harvest, HarvestStats } from './types';
import { getLogger } from '../../logging';

const MILLIS_PER_DAY: number = 1000 * 60 * 60 * 24;

const logger = getLogger('harvests-stats');

function calculate(harvests: Harvest[]): HarvestStats {
  const harvestsByDate: Map<Date, Harvest[]> = mapHarvestsToDates(harvests);

  logger.info('date keys' + Array.from(harvestsByDate.keys()).map(d => d.toDateString()));
  logger.info('harvestsByDate.size' + harvestsByDate.size);

  const harvestDates = findFirstAndLast(harvestsByDate);
  const numberOfDays = calculateNumberOfDays(harvestDates.firstHarvestDate, harvestDates.lastHarvestDate);

  return {
    numberOfHarvests: harvestsByDate.size,
    firstHarvestDate: harvestDates.firstHarvestDate,
    lastHarvestDate: harvestDates.lastHarvestDate,
    numberOfDays,
  };
}

function mapHarvestsToDates(harvests: Harvest[]): Map<Date, Harvest[]> {
  return harvests.reduce((harvestsByDate, harvest) => {
    const dateKey = harvest.harvestDate;
    dateKey.setHours(0, 0, 0, 0);

    if (!harvestsByDate.has(dateKey)) {
      harvestsByDate.set(dateKey, []);
    }

    harvestsByDate.get(dateKey)!.push(harvest);

    return harvestsByDate;
  }, new Map<Date, Harvest[]>());
}

function findFirstAndLast(harvestsByDate: Map<Date, Harvest[]>) {
  const dates: Date[] = Array.from(harvestsByDate.keys());

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

export default {
  calculate,
};
