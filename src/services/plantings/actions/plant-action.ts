import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting, SplitData, TransplantActionData } from '../types';
import datasource from '../plantings-mysql-datasource';
import { ensureError, FeralError } from '../../../errors';
import { BadRequestError } from '../../../errors/common';
import constants from '../../../util/constants';
import { getLogger } from '../../../logging';

const logger = getLogger('plant-action');

export class PlantAction implements PlantingAction {
  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    const actionData = plantingActionRequest.transplantActionData!;

    // checked first, so a missing plot is the client's mistake by name, not a foreign key failure
    if (actionData.plotId && !await datasource.plotExists(actionData.plotId)) {
      throw new BadRequestError(`Unknown plot id: ${actionData.plotId}`)
        .withDebugParams({ plantingActionRequest, });
    }

    try {
      // the remainder split, the move to PLANTED and its history row are one transaction
      await datasource.plantPlanting(
        currentPlanting,
        { status: constants.plantings.statuses.planted, ...actionData, },
        remainderToSplitOff(currentPlanting, actionData),
        actionData.comment);
    } catch (err) {
      throw new TransplantActionError(ensureError(err)).withDebugParams({ currentPlanting, plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

/** The plants left over when fewer are planted out than were sown; they stay a STARTED planting. */
function remainderToSplitOff(currentPlanting: Planting, actionData: TransplantActionData): SplitData | undefined {
  if (!(currentPlanting.numberSown! > actionData.numberTransplanted!)) {
    return undefined;
  }

  const remaining = currentPlanting.numberSown! - actionData.numberTransplanted!;
  logger.info(`Planting out ${actionData.numberTransplanted!} of ${currentPlanting.numberSown!}; ` +
    `splitting off the ${remaining} remaining`);

  return {
    name: currentPlanting.name + `(${remaining} Remaining)`,
    count: remaining,
  };
}

class TransplantActionError extends FeralError {
  constructor(cause?: FeralError) {
    super('Error performing PLANT action for planting', cause);
  }
}
