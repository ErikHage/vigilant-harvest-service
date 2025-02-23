import { PlantingAction } from './planting-action';
import { StartAction } from './start-action';
import { PlantAction } from './plant-action';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

const actionMap: Map<string, PlantingAction> = new Map<string, PlantingAction>();

actionMap.set(constants.plantings.actionTypes.start, new StartAction());
actionMap.set(constants.plantings.actionTypes.plant, new PlantAction());

export function getStrategy(actionType: string): PlantingAction {
  const action = actionMap.get(actionType);

  if (!action) {
    throw new FeralError('invalid action type: ' + actionType);
  }

  return action;
}
