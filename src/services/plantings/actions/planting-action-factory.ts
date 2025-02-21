import { PlantingAction } from './planting-action';
import { SowAction } from './sow-action';
import { FeralError } from '../../../errors';
import { TransplantAction } from './transplant-action';

const actionMap: Map<string, PlantingAction> = new Map<string, PlantingAction>();

actionMap.set('Sow', new SowAction());
actionMap.set('Transplant', new TransplantAction());

export function getStrategy(actionType: string): PlantingAction {
  const action = actionMap.get(actionType);

  if (!action) {
    throw new FeralError('invalid action type: ' + actionType);
  }

  return action;
}
