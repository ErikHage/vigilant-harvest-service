import { PlantingUpdateRequest } from './types';
import { PlantingValidationError } from './errors';
import constants from '../../util/constants'

const { plantings: { statuses, }, } = constants;

const allowedUpdateFields = {
  [statuses.created]: [
    'name', 'seedSource', 'lotNumber', 'plantId', 'leadTimeWeeks',
  ],
  [statuses.started]: [
    'name', 'seedSource', 'lotNumber', 'sowDate', 'numberSown',
  ],
  [statuses.planted]: [
    'name', 'seedSource', 'lotNumber', 'plotId', 'transplantDate', 'numberTransplanted',
  ],
  [statuses.retired]: [
    'name', 'seedSource', 'lotNumber',
  ],
};

function validateUpdateInput(currentStatus: string, updateRequest: PlantingUpdateRequest): void {
  const allowedFields = allowedUpdateFields[currentStatus];

  const notAllowedFields = Object.entries(updateRequest)
    .filter(([ , value, ]) => value != undefined)
    .filter(([ field, , ]) => {
      if (allowedFields!.includes(field)) {
        return;
      }
      return field;
    })
    .map(([ field, , ]) => field);

  if (notAllowedFields.length > 0) {
    throw new PlantingValidationError(`Found fields that are not allowed to be updated for status ${currentStatus}`)
      .withDebugParams({
        updateRequest,
        notAllowedFields,
      })
  }
}

export default {
  validateUpdateInput,
};
