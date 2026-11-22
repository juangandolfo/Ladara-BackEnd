import test from 'node:test';
import assert from 'node:assert/strict';
import {success, error, validationError} from './api-response';

function createResponse() {
    const response: any = {};
    const res: any = {
        status(code: number) {
            response.status = code;
            return res;
        },
        json(body: unknown) {
            response.body = body;
            return res;
        },
    };
    return {response, res};
}

test('success() defaults to 200 and omits message/data when not provided', () => {
    const {response, res} = createResponse();
    success(res);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {success: true});
});

test('success() includes message and data when provided, without leaking undefined keys', () => {
    const {response, res} = createResponse();
    success(res, {id: 1}, 'Product retrieved successfully');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {success: true, message: 'Product retrieved successfully', data: {id: 1}});
});

test('success() supports a custom status and extra merged fields (meta/count)', () => {
    const {response, res} = createResponse();
    success(res, [1, 2], 'Products filtered successfully', 200, {meta: {total: 2}});
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        success: true,
        message: 'Products filtered successfully',
        data: [1, 2],
        meta: {total: 2},
    });

    const created = createResponse();
    success(created.res, {id: 1}, 'Product created successfully', 201);
    assert.equal(created.response.status, 201);
});

test('error() defaults to 400 and omits the error detail when not provided', () => {
    const {response, res} = createResponse();
    error(res, 'User not authenticated', 401);
    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {success: false, message: 'User not authenticated'});
});

test('error() includes the error detail when provided and defaults status to 400', () => {
    const {response, res} = createResponse();
    error(res, 'Error filtering products', 500, 'boom');
    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {success: false, message: 'Error filtering products', error: 'boom'});

    const defaulted = createResponse();
    error(defaulted.res, 'Minimum price cannot be greater than maximum price');
    assert.equal(defaulted.response.status, 400);
});

test('validationError() always returns 400 with the raw errors payload', () => {
    const {response, res} = createResponse();
    const errors = [{msg: 'Invalid value', param: 'minPrice'}];
    validationError(res, errors);
    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {success: false, errors});
});
