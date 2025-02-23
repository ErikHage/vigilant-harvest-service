import { PlantingAction } from './planting-action';
import { CommentAction } from './comment-action';
import { StartAction } from './start-action';
import { PlantAction } from './plant-action';
import { RetireAction } from './retire-action';
import { DeleteAction } from './delete-action';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

const actionMap: Map<string, PlantingAction> = new Map<string, PlantingAction>();

actionMap.set(constants.plantings.actionTypes.comment, new CommentAction());
actionMap.set(constants.plantings.actionTypes.delete, new DeleteAction());
actionMap.set(constants.plantings.actionTypes.start, new StartAction());
actionMap.set(constants.plantings.actionTypes.plant, new PlantAction());
actionMap.set(constants.plantings.actionTypes.retire, new RetireAction());

export function getStrategy(actionType: string): PlantingAction {
  const action = actionMap.get(actionType);

  if (!action) {
    throw new FeralError('invalid action type: ' + actionType);
  }

  return action;
}
