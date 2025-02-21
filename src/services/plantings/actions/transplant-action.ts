import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class TransplantAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      // await datasource.updatePlanting({
      //
      // });
    } catch (err) {
      throw new TransplantActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }

}

class TransplantActionError extends FeralError {
  constructor() {
    super('Error performing TRANSPLANT action for planting');
  }
}
