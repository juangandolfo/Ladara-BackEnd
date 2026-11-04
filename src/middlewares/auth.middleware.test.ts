import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createAuthorizeMiddleware } from './auth.middleware';
import { checkAdminMiddleware } from './check-admin.middleware';

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
    json(body: unknown) {
      response.body = body;
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

test('authorization supports 401 for endpoints that require standard unauthorized status', async () => {
  const { response, res } = createResponse();
  const middleware = createAuthorizeMiddleware({ getEntityById: async () => ({ id: 'user-1' }) }, 401);

  await middleware({ headers: {} } as any, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(response.status, 401);
});

test('admin middleware rejects unauthenticated and non-admin users and allows admins', () => {
  const unauthenticated = createResponse();
  checkAdminMiddleware({ entity: undefined } as any, unauthenticated.res, () => {
    throw new Error('next should not be called for unauthenticated users');
  });
  assert.equal(unauthenticated.response.status, 401);

  const customer = createResponse();
  checkAdminMiddleware({ entity: { id: 'user-1', isAdmin: false } } as any, customer.res, () => {
    throw new Error('next should not be called for non-admin users');
  });
  assert.equal(customer.response.status, 403);

  const admin = createResponse();
  let nextCalled = false;
  checkAdminMiddleware({ entity: { id: 'admin-1', isAdmin: true } } as any, admin.res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});
