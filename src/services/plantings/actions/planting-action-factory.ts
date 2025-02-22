import plantingActions, { PlantingAction } from './planting-action';
import { SowAction } from './sow-action';
import { FeralError } from '../../../errors';
import { TransplantAction } from './transplant-action';

const { actionTypes, } = plantingActions;

const actionMap: Map<string, PlantingAction> = new Map<string, PlantingAction>();

actionMap.set(actionTypes.sow, new SowAction());
actionMap.set(actionTypes.transplant, new TransplantAction());

export function getStrategy(actionType: string): PlantingAction {
  const action = actionMap.get(actionType);

  if (!action) {
    throw new FeralError('invalid action type: ' + actionType);
  }

  return action;
}
