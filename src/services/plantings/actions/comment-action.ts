import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';

import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class CommentAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    const planting: Planting = await datasource.getPlantingById(plantingActionRequest.plantingId);

    try {
      await datasource.insertStatusHistory(
        plantingActionRequest.plantingId,
        planting.currentStatus,
        plantingActionRequest.commentActionData!.comment);
    } catch (err) {
      throw new CommentActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

class CommentActionError extends FeralError {
  constructor() {
    super('Error performing COMMENT action for planting');
  }
}
