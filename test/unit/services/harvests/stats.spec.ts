import { describe, expect, it } from 'vitest';

import stats from '../../../../src/services/harvests/stats';
import { HydratedHarvest } from '../../../../src/services/harvests/types';
import { StatsType } from '../../../../src/types/stats-type';

let nextId = 1;

function aHarvest(harvestDate: string, quantity = 1): HydratedHarvest {
  return {
    harvestId: `harvest-${nextId++}`,
    plantingId: 'planting-1',
    plantingName: 'row one',
    plantId: 'plant-1',
    plantName: 'tomato',
    plotName: 'north bed',
    quantity,
    harvestDate,
    harvestTypeId: 2,
    harvestType: 'pounds',
  };
}

describe.each([ StatsType.Planting, StatsType.Plant, ])('%s stats', statsType => {
  it('counts the days across the autumn clock change as calendar days', () => {
    // 2026-10-31 to 2026-11-02 in America/New_York is 49 hours, which a count of 24-hour days rounds to 4
    const result = stats.calculate([ aHarvest('2026-10-31', 2), aHarvest('2026-11-02', 4), ], statsType);

    expect(result).toMatchObject({
      numberOfHarvests: 2,
      numberOfDays: 3,
      firstHarvestDate: '2026-10-31',
      lastHarvestDate: '2026-11-02',
    });
    expect(result.stats).toEqual([ expect.objectContaining({
      totalQuantity: 6,
      averageHarvestPerDay: 2,
      firstHarvest: '2026-10-31',
      lastHarvest: '2026-11-02',
    }), ]);
  });

  it('counts the days across the spring clock change as calendar days', () => {
    const result = stats.calculate([ aHarvest('2026-03-07'), aHarvest('2026-03-09'), ], statsType);

    expect(result.numberOfDays).toBe(3);
  });

  it('counts harvests on one day once', () => {
    const result = stats.calculate([ aHarvest('2026-07-01'), aHarvest('2026-07-01'), ], statsType);

    expect(result).toMatchObject({ numberOfHarvests: 1, numberOfDays: 1, firstHarvestDate: '2026-07-01', lastHarvestDate: '2026-07-01', });
  });

  it('finds the first and last days whatever order the harvests come in', () => {
    const result = stats.calculate([ aHarvest('2026-08-15'), aHarvest('2026-06-30'), aHarvest('2026-07-04'), ], statsType);

    expect(result).toMatchObject({ firstHarvestDate: '2026-06-30', lastHarvestDate: '2026-08-15', numberOfDays: 47, });
  });

  it('reports no days for a year with no harvests', () => {
    const result = stats.calculate([], statsType);

    expect(result).toMatchObject({ numberOfHarvests: 0, numberOfDays: 0, firstHarvestDate: null, lastHarvestDate: null, });
    expect(result.stats).toEqual([]);
  });
});
