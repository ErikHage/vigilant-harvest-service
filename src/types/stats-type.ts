export enum StatsType {
  Plant = 'Plant',
  Planting = 'Planting'
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StatsTypeUtils {
  static parse(value: string): StatsType | null {
    if (Object.values(StatsType).includes(value as StatsType)) {
      return value as StatsType;
    }
    return null;
  }

  static isValid(value: string): value is StatsType {
    return Object.values(StatsType).includes(value as StatsType);
  }
}
