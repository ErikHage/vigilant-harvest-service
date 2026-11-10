import { describe, expect, it } from 'vitest';

import {
  getDirectSowPlanningItems,
  getIndoorSowPlanningItems,
  targetDayOf
} from '../../../../src/services/planning/planning-service';
import { PlanningPlanting } from '../../../../src/services/planning/types';

function aPlanting(overrides: Partial<PlanningPlanting> = {}): PlanningPlanting {
  return {
    plantingId: 'planting-1',
    plantingName: 'row one',
    plantId: 'plant-1',
    plantName: 'tomato',
    currentStatus: 'CREATED',
    ...overrides,
  };
}

describe('targetDayOf', () => {
  it.each([
    [ '2026-05-15', 135, ],
    [ '2028-05-15', 136, ], // after 29 February
    [ '2026-11-01', 305, ], // the autumn clock change
  ])('plants %s on day %i', (targetPlantingDate, day) => {
    expect(targetDayOf(aPlanting({ targetPlantingDate, }), 100)).toBe(day);
  });

  it("falls back to the year's target day when the planting has none", () => {
    expect(targetDayOf(aPlanting(), 100)).toBe(100);
  });
});

describe('getDirectSowPlanningItems', () => {
  it('plans a planting with no lead time for its target day, counting from today', () => {
    const items = getDirectSowPlanningItems([ aPlanting({ targetPlantingDate: '2026-05-15', }), ], 100, 60);

    expect(items).toEqual([ expect.objectContaining({ plannedActionDay: 135, daysUntilAction: 75, }), ]);
  });

  it("uses the year's target day for a planting without one", () => {
    const items = getDirectSowPlanningItems([ aPlanting(), ], 140, 60);

    expect(items).toEqual([ expect.objectContaining({ plannedActionDay: 140, daysUntilAction: 80, }), ]);
  });

  it('leaves out a planting with a lead time', () => {
    expect(getDirectSowPlanningItems([ aPlanting({ leadTimeDays: 42, }), ], 140, 60)).toEqual([]);
  });
});

describe('getIndoorSowPlanningItems', () => {
  it('plans a planting with a lead time that many days before its target day', () => {
    const items = getIndoorSowPlanningItems([ aPlanting({ targetPlantingDate: '2026-05-15', leadTimeDays: 42, }), ], 100, 60);

    expect(items).toEqual([ expect.objectContaining({ plannedActionDay: 93, daysUntilAction: 33, }), ]);
  });

  it('counts a day already past as negative', () => {
    const items = getIndoorSowPlanningItems([ aPlanting({ targetPlantingDate: '2026-03-15', leadTimeDays: 28, }), ], 100, 60);

    expect(items).toEqual([ expect.objectContaining({ plannedActionDay: 46, daysUntilAction: -14, }), ]);
  });

  it('leaves out a planting with no lead time', () => {
    expect(getIndoorSowPlanningItems([ aPlanting(), ], 140, 60)).toEqual([]);
  });
});
