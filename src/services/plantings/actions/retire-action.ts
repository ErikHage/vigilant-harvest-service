import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { ensureError, FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class RetireAction implements PlantingAction {
  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      // the move to RETIRED and its history row are one transaction
      await datasource.changePlantingStatus(
        plantingActionRequest.plantingId,
        { status: constants.plantings.statuses.retired, },
        plantingActionRequest.retireActionData!.comment);
    } catch (err) {
      throw new RetireActionError(ensureError(err)).withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }

}

class RetireActionError extends FeralError {
  constructor(cause?: FeralError) {
    super('Error performing RETIRE action for planting', cause);
  }
}
