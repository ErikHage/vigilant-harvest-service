import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';
import { getLogger } from '../../../logging';

const logger = getLogger('plant-action');

export class PlantAction implements PlantingAction {
  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      // split out the remaining number sown to stay as a STARTED planting
      await splitOutRemainder(currentPlanting, plantingActionRequest);

      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        status: constants.plantings.statuses.planted,
        ...plantingActionRequest.transplantActionData,
      });
      await datasource.insertStatusHistory(
        plantingActionRequest.plantingId,
        constants.plantings.statuses.planted,
        plantingActionRequest.transplantActionData?.comment ?? '---');
    } catch (err) {
      throw new TransplantActionError().withDebugParams({ currentPlanting, plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

async function splitOutRemainder(currentPlanting: Planting, plantingActionRequest: PerformActionRequest) {
  const actionData = plantingActionRequest.transplantActionData!;

  logger.info(`Checking if split needed for planting. Current number sown [${currentPlanting.numberSown!}]
                and number to be planted [${actionData.numberTransplanted!}]`);
  if (currentPlanting.numberSown! > actionData.numberTransplanted!) {
    const newNumberSown = currentPlanting.numberSown! - actionData.numberTransplanted!;
    logger.info(`Number sown greater than number to be planted. Splitting out ${newNumberSown} remaining plants`);

    await datasource.splitPlanting(plantingActionRequest.plantingId, [
      {
        name: currentPlanting.name + `(${newNumberSown} Remaining)`,
        count: newNumberSown,
      },
    ]);
  }
}

class TransplantActionError extends FeralError {
  constructor() {
    super('Error performing PLANT action for planting');
  }
}
