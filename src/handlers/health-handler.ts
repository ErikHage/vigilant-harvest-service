import { Request, Response } from 'express';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

/**
 * Answers "is this process serving?" for the Docker HEALTHCHECK. It needs no
 * token and touches no database, so a database outage doesn't mark the
 * container unhealthy.
 */
function getHealth(request: Request, response: Response) {
  response.status(httpStatus.OK).json({ status: 'ok', });
}

export default tryDecorator.decorate(getHealth);
