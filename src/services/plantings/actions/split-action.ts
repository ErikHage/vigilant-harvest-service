import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting, SplitData } from '../types';
import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';

export class SplitAction implements PlantingAction {
  async performAction(plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      const splits = plantingActionRequest.splitActionData!.splits;
      await validateSplitCount(plantingActionRequest.plantingId, splits);
      await datasource.splitPlanting(plantingActionRequest.plantingId, splits);
    } catch (err) {
      throw new SplitActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

async function validateSplitCount(sourcePlantingId: string, splits: SplitData[]): Promise<void> {
  const currentPlanting = await datasource.getPlantingById(sourcePlantingId);
  const sourceCount = currentPlanting.numberSown || 0;
  const splitCount = splits.reduce((acc, split) => acc + split.count, 0);

  if (splitCount >= sourceCount) {
    throw new SplitActionOverflowError(sourceCount, splitCount)
      .withDebugParams({ sourcePlantingId, splits, });
  }
}

class SplitActionError extends FeralError {
  constructor() {
    super('Error performing SPLIT action for planting');
  }
}

class SplitActionOverflowError extends FeralError {
  constructor(sourceCount: number, splitCount: number) {
    super(`Total split count [${splitCount}] meets or exceeds source planting numberSown [${sourceCount}]`);
  }
}
