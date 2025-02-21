import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';

import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class SowAction implements PlantingAction {

  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        ...plantingActionRequest.sowActionData,
      });
    } catch (err) {
      throw new SowActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

class SowActionError extends FeralError {
  constructor() {
    super('Error performing SOW action for planting');
  }
}
