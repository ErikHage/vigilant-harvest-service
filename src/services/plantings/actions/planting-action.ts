import { PerformActionRequest, Planting } from '../types';

export interface PlantingAction {
  performAction(plantingActionRequest: PerformActionRequest): Promise<Planting>;
}

const actionTypes = {
  comment: 'COMMENT',
  sow: 'SOW',
  transplant: 'TRANSPLANT',
  delete: 'DELETE',
  retire: 'RETIRE',
}

const allowedLifecycleTransitions: Map<string, string[]> = new Map<string, string[]>();

allowedLifecycleTransitions.set('CREATED', [ actionTypes.comment, actionTypes.sow, actionTypes.delete, ]);
allowedLifecycleTransitions.set('INDOOR SOWN', [ actionTypes.comment, actionTypes.transplant, ]);
allowedLifecycleTransitions.set('OUTDOOR SOWN', [ actionTypes.comment, actionTypes.retire, ]);
// do I need this? maybe if I accidentally retire
// allowedLifecycleTransitions.set('RETIRED', [ actionTypes.comment, 'REVIVE', ]);

export default {
  actionTypes,
  allowedLifecycleTransitions,
}
