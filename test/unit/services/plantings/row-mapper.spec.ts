import { describe, expect, it } from 'vitest';

import rowMapper from '../../../../src/services/plantings/row-mapper';

const { toColumns, } = rowMapper.plantings.update;

describe('the planting update\'s columns', () => {
  it('always sets the status', () => {
    expect(toColumns({ status: 'CREATED', })).toEqual([ [ 'current_status', 'CREATED', ], ]);
  });

  it('maps every field to its column, in one order', () => {
    const columns = toColumns({
      status: 'PLANTED',
      name: 'Row one',
      plantId: 'a-plant',
      seedSource: 'Saved',
      lotNumber: 'LOT-7',
      plotId: 'a-plot',
      targetPlantingDate: '2026-05-15',
      leadTimeWeeks: 6,
      numberSown: 10,
      sowDate: '2026-03-01',
      sowType: 'indoor',
      transplantDate: '2026-05-20',
      numberTransplanted: 4,
      notes: 'A note',
    });

    expect(columns).toEqual([
      [ 'current_status', 'PLANTED', ],
      [ 'planting_name', 'Row one', ],
      [ 'plant_id', 'a-plant', ],
      [ 'seed_source', 'Saved', ],
      [ 'lot_number', 'LOT-7', ],
      [ 'plot_id', 'a-plot', ],
      [ 'target_planting_date', '2026-05-15', ],
      [ 'lead_time_weeks', 6, ],
      [ 'number_sown', 10, ],
      [ 'sow_date', '2026-03-01', ],
      [ 'sow_type', 'indoor', ],
      [ 'transplant_date', '2026-05-20', ],
      [ 'number_transplanted', 4, ],
      [ 'notes', 'A note', ],
    ]);
  });

  // The old parallel lists tested each field with if (field), which skipped 0 and could not clear one
  it('keeps a 0 and a null, and leaves out what was not given', () => {
    expect(toColumns({ status: 'CREATED', leadTimeWeeks: 0, seedSource: null, notes: undefined, })).toEqual([
      [ 'current_status', 'CREATED', ],
      [ 'seed_source', null, ],
      [ 'lead_time_weeks', 0, ],
    ]);
  });
});
