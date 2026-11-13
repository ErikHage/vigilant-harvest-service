import { describe, expect, it } from 'vitest';

import plantingValidation from '../../../../src/services/plantings/planting-validation';
import { PlantingValidationError } from '../../../../src/services/plantings/errors';
import { PlantingUpdateRequest } from '../../../../src/services/plantings/types';

const { validateUpdateInput, } = plantingValidation;

/** One value for each field an update can carry, so a test can send any of them. */
const someValueOf: Required<PlantingUpdateRequest> = {
  name: 'Row one',
  plantId: 'a-plant',
  seedSource: 'Saved',
  lotNumber: 'LOT-7',
  targetPlantingDate: '2026-05-15',
  plotId: 'a-plot',
  numberTransplanted: 4,
  leadTimeWeeks: 6,
  sowDate: '2026-03-01',
  sowType: 'indoor',
  numberSown: 10,
  transplantDate: '2026-05-20',
  notes: 'A note',
};

const ALL_FIELDS = Object.keys(someValueOf) as (keyof PlantingUpdateRequest)[];

/** What each status lets an update change, as the app's edit form sends it. */
const ALLOWED: Record<string, (keyof PlantingUpdateRequest)[]> = {
  CREATED: [ 'name', 'seedSource', 'lotNumber', 'plantId', 'targetPlantingDate', 'leadTimeWeeks', ],
  STARTED: [ 'name', 'seedSource', 'lotNumber', 'sowDate', 'numberSown', 'targetPlantingDate', ],
  PLANTED: [ 'name', 'seedSource', 'lotNumber', 'plotId', 'transplantDate', 'numberTransplanted', ],
  RETIRED: [ 'name', 'seedSource', 'lotNumber', ],
};

const rejection = (status: string, update: PlantingUpdateRequest): unknown => {
  try {
    validateUpdateInput(status, update);
    return undefined;
  } catch (err) {
    return err;
  }
};

describe('validateUpdateInput', () => {
  it.each(Object.entries(ALLOWED))('lets a %s planting change every field it allows, at once', (status, fields) => {
    const update = Object.fromEntries(fields.map(field => [ field, someValueOf[field], ]));

    expect(rejection(status, update)).toBeUndefined();
  });

  const disallowed = Object.entries(ALLOWED)
    .flatMap(([ status, fields, ]) => ALL_FIELDS.filter(field => !fields.includes(field)).map(field => [ status, field, ]));

  it.each(disallowed)('rejects a %s planting\'s %s, as a 400', (status, field) => {
    const err = rejection(status, { [field]: someValueOf[field as keyof PlantingUpdateRequest], });

    expect(err).toBeInstanceOf(PlantingValidationError);
    expect((err as PlantingValidationError).status).toBe(400);
    expect((err as Error).message).toContain('not allowed to be updated');
  });

  // null clears a field, so it's a change like any other value
  it('rejects a field the status does not allow, sent as null', () => {
    expect(rejection('CREATED', { numberSown: null, })).toBeInstanceOf(PlantingValidationError);
  });

  it('ignores a field that was left out', () => {
    expect(rejection('CREATED', { name: 'Row one', numberSown: undefined, })).toBeUndefined();
  });

  it('lets an update that changes nothing through', () => {
    expect(rejection('RETIRED', {})).toBeUndefined();
  });
});
