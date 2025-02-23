import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class RetireAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        status: constants.plantings.statuses.retired,
        ...plantingActionRequest.retireActionData,
      });
    } catch (err) {
      throw new TransplantActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }

}

class TransplantActionError extends FeralError {
  constructor() {
    super('Error performing RETIRE action for planting');
  }
}
