import { HarvestType } from './types';

import datasource from './harvest-types-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

async function getHarvestTypes(): Promise<HarvestType[]> {
  try {
    return await datasource.getHarvestTypes();
  } catch (err) {
    throw new FeralError('Error getting harvest types', ensureError(err));
  }
}

export default {
  getHarvestTypes,
}
