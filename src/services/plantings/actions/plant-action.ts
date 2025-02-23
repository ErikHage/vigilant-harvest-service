import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class PlantAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        status: constants.plantings.statuses.planted,
        ...plantingActionRequest.transplantActionData,
        comment: plantingActionRequest.transplantActionData?.comment ?? '---',
      });
    } catch (err) {
      throw new TransplantActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }

}

class TransplantActionError extends FeralError {
  constructor() {
    super('Error performing PLANT action for planting');
  }
}
