import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';

import datasource from '../plantings-mysql-datasource';
import { ensureError, FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class StartAction implements PlantingAction {

  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    const { sowDate, numberSown, comment, } = plantingActionRequest.sowActionData!;

    try {
      // the move to STARTED and its history row are one transaction
      await datasource.changePlantingStatus(
        plantingActionRequest.plantingId,
        { status: constants.plantings.statuses.started, sowDate, numberSown, },
        comment);
    } catch (err) {
      throw new SowActionError(ensureError(err)).withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

class SowActionError extends FeralError {
  constructor(cause?: FeralError) {
    super('Error performing START action for planting', cause);
  }
}
