import { Planting } from '../types';

export interface PlantingAction {
  performAction(): Promise<Planting>;
}
