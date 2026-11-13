import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import buildApiRouter from './routes/api-router';
import errorHandler from './middleware/error-handler';

/**
 * The sites whose pages may read the API's answers, from CORS_ORIGINS, separated by commas. By
 * default, the dev app (vite --port 5174) and the live site. The live app is served from the
 * service's own origin, so it needs none, but it's listed anyway. Any other site's browser is
 * given no Access-Control-Allow-Origin, so it can't read an answer.
 */
const DEFAULT_CORS_ORIGINS = 'http://localhost:5174,https://theferalrooster.com';

function corsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? DEFAULT_CORS_ORIGINS)
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin !== '');
}

const getApp = (appRoot: string, port: string): Express => {
  const app: Express = express();

  app.set('port', port);
  app.disable('x-powered-by');

  app.use(express.urlencoded({ extended: false, }));
  app.use(bodyParser.json());

  app.use(cors({ origin: corsOrigins(), }));

  app.use('/api/vigilant-harvest-service/v0', buildApiRouter());

  // The body parsers above run before the API router, so their errors (a body
  // that isn't JSON) never reach the router's handler.
  app.use(errorHandler);

  return app;
}

export default getApp;
