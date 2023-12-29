import chai from 'chai';
import supertest from 'supertest';
import app from '../index.mjs'; // Adjust the path as needed

const { expect } = chai;
const request = supertest(app);

describe('Express App Tests', () => {
  it('should return a welcome message on /', async () => {
    const response = await request.get('/');
    expect(response.status).to.equal(200);
    expect(response.text).to.include('Welcome to your Express.js app');
  });

  it('should handle API requests properly', async () => {
    const response = await request.get('/api/mistral?query=Hello');
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('status', 200);
    expect(response.body).to.have.property('maintain_by', 'ISOY DEV');
    expect(response.body).to.have.property('content'
