import { PerformActionRequest, Planting } from '../types';

export interface PlantingAction {
  performAction(plantingActionRequest: PerformActionRequest): Promise<Planting>;
}

const allowedLifecycleTransitions: Map<string, string[]> = new Map<string, string[]>();

allowedLifecycleTransitions.set('CREATED', [ 'COMMENT', 'SOW', 'DELETE', ]);
allowedLifecycleTransitions.set('INDOOR SOWN', [ 'COMMENT', 'TRANSPLANT', ]);
allowedLifecycleTransitions.set('OUTDOOR SOWN', [ 'COMMENT', 'RETIRE', ]);
// do I need this? maybe if I accidentally retire
// allowedLifecycleTransitions.set('RETIRED', [ 'COMMENT', 'REVIVE', ]);

export default {
  allowedLifecycleTransitions,
}
