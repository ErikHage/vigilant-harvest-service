import { Request, Response } from 'express';
import * as packageJson from '../../package.json';

function getServiceInfo(request: Request, response: Response) {
  response.status(200).json({
    name: 'vigilant-harvest-service',
    version: packageJson.version,
  });
}

export default getServiceInfo;
