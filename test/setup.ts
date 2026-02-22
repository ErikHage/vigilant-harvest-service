import dotenv from 'dotenv';
import supertest from 'supertest';
import getApp from '../src/app';

dotenv.config();

const app = getApp(__dirname, '8102');
export const client = supertest(app);
