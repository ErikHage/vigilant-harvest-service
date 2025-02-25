import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';

import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class CommentAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.insertStatusHistory(
        plantingActionRequest.plantingId,
        'COMMENT',
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
