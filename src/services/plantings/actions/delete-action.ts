import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class DeleteAction implements PlantingAction {
  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.deletePlantingById(plantingActionRequest.plantingId);
    } catch (err) {
      throw new DeleteActionError().withDebugParams({ plantingActionRequest, });
    }

    // to fit the pattern, doesn't really matter
    return {
      plantingId: '-1',
      plantId: '-1',
      plantingYear: 1,
      plantingYears: [ 1, ],
      name: 'Deleted',
      currentStatus: 'DELETED',
      notes: '',
    };
  }
}

class DeleteActionError extends FeralError {
  constructor() {
    super('Error performing DELETE action for planting');
  }
}
