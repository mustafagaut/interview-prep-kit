import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';
import { app } from './index.js';

async function request(path: string, options: http.RequestOptions = {}, body?: unknown) {
  const server = http.createServer(app).listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not start');

  const response = await new Promise<{ statusCode?: number; body: string }>((resolve, reject) => {
    const request = http.request({ ...options, hostname: '127.0.0.1', port: address.port, path, method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...options.headers } }, result => {
      let responseBody = '';
      result.setEncoding('utf8');
      result.on('data', chunk => { responseBody += chunk; });
      result.on('end', () => {
        const statusCode = result.statusCode;
        resolve(statusCode === undefined ? { body: responseBody } : { statusCode, body: responseBody });
      });
    });
    request.on('error', reject);
    if (body !== undefined) request.write(JSON.stringify(body));
    request.end();
  });
  server.close();
  return response;
}

test('health endpoint reports API availability', async () => {
  const response = await request('/health');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'ok' });
});

test('kit creation validates required input before MongoDB access', async () => {
  const response = await request('/api/kits', { method: 'POST' }, { jd: '' });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: 'jd is required' });
});

test('kit updates reject malformed question collections', async () => {
  const response = await request('/api/kits/507f1f77bcf86cd799439011', { method: 'PUT' }, { questions: 'not-an-array' });
  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: 'questions must be an array' });
});

test('readiness reports unavailable before MongoDB connects', async () => {
  const response = await request('/ready');
  assert.equal(response.statusCode, 503);
  assert.deepEqual(JSON.parse(response.body), { status: 'not_ready' });
});