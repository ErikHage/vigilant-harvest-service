import { client } from './setup';
import * as packageJson from '../package.json';

describe('Service Info', () => {
  it('GET /api/vigilant-harvest-service/v0/service-info returns 200', async () => {
    const res = await client.get('/api/vigilant-harvest-service/v0/service-info');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'vigilant-harvest-service',
      version: packageJson.version,
    });
  });
});
