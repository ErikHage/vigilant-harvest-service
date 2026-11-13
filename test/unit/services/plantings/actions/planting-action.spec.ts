import { describe, expect, it } from 'vitest';

import actions from '../../../../../src/services/plantings/actions/planting-action';

const { allowedLifecycleTransitions, } = actions;

const STATUSES = [ 'CREATED', 'STARTED', 'PLANTED', 'RETIRED', ];
const ACTIONS = [ 'COMMENT', 'START', 'PLANT', 'SPLIT', 'DELETE', 'RETIRE', ];

/** The lifecycle: each status, and the actions taken from it. Every other pairing is refused. */
const LIFECYCLE: Record<string, string[]> = {
  CREATED: [ 'COMMENT', 'START', 'PLANT', 'DELETE', ],
  STARTED: [ 'COMMENT', 'PLANT', 'SPLIT', 'RETIRE', ],
  PLANTED: [ 'COMMENT', 'RETIRE', ],
  RETIRED: [ 'COMMENT', ],
};

describe('the planting lifecycle', () => {
  it('covers every status, and no others', () => {
    expect([ ...allowedLifecycleTransitions.keys(), ].sort()).toEqual([ ...STATUSES, ].sort());
  });

  const pairings = STATUSES.flatMap(status => ACTIONS.map(action => [ status, action, LIFECYCLE[status]!.includes(action), ] as const));

  it.each(pairings)('from %s, %s is allowed: %s', (status, action, allowed) => {
    expect(allowedLifecycleTransitions.get(status)!.includes(action)).toBe(allowed);
  });
});
