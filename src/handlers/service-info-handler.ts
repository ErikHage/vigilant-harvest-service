import { Request, Response } from 'express';
import * as packageJson from '../../package.json';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

function getServiceInfo(request: Request, response: Response) {
  response.status(httpStatus.OK).json({
    name: 'vigilant-harvest-service',
    version: packageJson.version,
  });
}

export default tryDecorator.decorate(getServiceInfo);
