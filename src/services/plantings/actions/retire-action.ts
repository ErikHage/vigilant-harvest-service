import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class RetireAction implements PlantingAction {
  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        status: constants.plantings.statuses.retired,
        ...plantingActionRequest.retireActionData,
      });
      await datasource.insertStatusHistory(
        plantingActionRequest.plantingId,
        constants.plantings.statuses.retired,
        plantingActionRequest.retireActionData?.comment ?? '---');
    } catch (err) {
      throw new RetireActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }

}

class RetireActionError extends FeralError {
  constructor() {
    super('Error performing RETIRE action for planting');
  }
}
