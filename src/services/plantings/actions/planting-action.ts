import { PerformActionRequest, Planting } from '../types';
import constants from '../../../util/constants';

export interface PlantingAction {
  performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting>;
}

const allowedLifecycleTransitions: Map<string, string[]> = new Map<string, string[]>();

allowedLifecycleTransitions.set(constants.plantings.statuses.created, [
  constants.plantings.actionTypes.comment,
  constants.plantings.actionTypes.start,
  constants.plantings.actionTypes.plant,
  constants.plantings.actionTypes.delete,
]);
allowedLifecycleTransitions.set(constants.plantings.statuses.started, [
  constants.plantings.actionTypes.comment,
  constants.plantings.actionTypes.plant,
  constants.plantings.actionTypes.split,
  constants.plantings.actionTypes.retire,
]);
allowedLifecycleTransitions.set(constants.plantings.statuses.planted, [
  constants.plantings.actionTypes.comment,
  constants.plantings.actionTypes.retire,
]);
// do I need a REVIVE action? maybe if I accidentally retire
allowedLifecycleTransitions.set(constants.plantings.statuses.retired, [
  constants.plantings.actionTypes.comment,
]);

export default {
  allowedLifecycleTransitions,
}
