import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createAuthorizeMiddleware } from './auth.middleware';

function createResponse() {
  const response: any = {};
  const res: any = {
    status(code: number) {
      response.status = code;
      return res;
    },
    send(message: string) {
      response.message = message;
      return res;
    },
  };
  return { response, res };
}

for (const [name, authorization] of [
  ['missing token', undefined],
  ['invalid token', 'Bearer invalid-token'],
  ['expired token', `Bearer ${jwt.sign({ id: 'user-1', name: 'User' }, 'some secret key', { expiresIn: -1 })}`],
] as const) {
  test(`authorization rejects ${name} with 403`, async () => {
    const { response, res } = createResponse();
    const middleware = createAuthorizeMiddleware({ getEntityById: async () => ({ id: 'user-1' }) });
    const req = { headers: authorization ? { authorization } : {} } as any;

    await middleware(req, res, () => {
      throw new Error('next should not be called');
    });

    assert.equal(response.status, 403);
  });
}
