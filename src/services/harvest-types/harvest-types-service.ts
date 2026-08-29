import { HarvestType } from './types';

import datasource from './harvest-types-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { getLogger } from '../../logging';

const logger = getLogger('harvest-types-service');

async function getHarvestTypes(): Promise<HarvestType[]> {
  try {
    return await datasource.getHarvestTypes();
  } catch (err) {
    const error = new FeralError('Error getting harvest types', ensureError(err));
    logger.error(error, 'Error getting harvest types');
    throw error;
  }
}

export default {
  getHarvestTypes,
}
