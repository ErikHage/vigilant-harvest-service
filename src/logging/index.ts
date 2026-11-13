import pino, { Logger } from 'pino';

const root: Logger = pino();

export function getLogger(name: string): Logger {
  return root.child({ name, });
}
