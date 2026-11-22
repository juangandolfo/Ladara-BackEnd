import test from 'node:test';
import assert from 'node:assert/strict';
import {ProductController} from './product.controller';

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

function stubFilterProducts(controller: ProductController, result: any) {
    let received: {filters: any; userId: any} | undefined;
    (controller as any).productService.filterProducts = async (filters: any, userId: any) => {
        received = {filters, userId};
        return result;
    };
    return () => received;
}

const sampleResult = {
    products: [{id: 1, name: 'Widget', price: 10}],
    total: 1,
    count: 1,
    appliedFilters: {name: 'Widget'},
};

test('filterProductsQuery reads filters from req.query and returns products with meta', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {response, res} = createResponse();

    await controller.filterProductsQuery({query: {name: 'Widget'}} as any, res as any);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        success: true,
        message: 'Products filtered successfully',
        data: sampleResult.products,
        meta: {total: 1, count: 1, appliedFilters: sampleResult.appliedFilters},
    });
    assert.deepEqual(getReceived()!.filters, {name: 'Widget'});
});

test('filterProductsBody reads filters from req.body and returns products with meta', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {response, res} = createResponse();

    await controller.filterProductsBody({body: {name: 'Widget'}} as any, res as any);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        success: true,
        message: 'Products filtered successfully',
        data: sampleResult.products,
        meta: {total: 1, count: 1, appliedFilters: sampleResult.appliedFilters},
    });
    assert.deepEqual(getReceived()!.filters, {name: 'Widget'});
});

test('filterProductsQuery rejects minPrice greater than maxPrice without calling the service', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {response, res} = createResponse();

    await controller.filterProductsQuery({query: {minPrice: 50, maxPrice: 10}} as any, res as any);

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {success: false, message: 'Minimum price cannot be greater than maximum price'});
    assert.equal(getReceived(), undefined);
});

test('filterProductsBody rejects minStock greater than maxStock without calling the service', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {response, res} = createResponse();

    await controller.filterProductsBody({body: {minStock: 50, maxStock: 10}} as any, res as any);

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {success: false, message: 'Minimum stock cannot be greater than maximum stock'});
    assert.equal(getReceived(), undefined);
});

test('filterProductsQuery maps service errors to a 500 response', async () => {
    const controller = new ProductController();
    (controller as any).productService.filterProducts = async () => {
        throw new Error('boom');
    };
    const {response, res} = createResponse();

    await controller.filterProductsQuery({query: {}} as any, res as any);

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, {success: false, message: 'Error filtering products', error: 'boom'});
});

test('filterProductsQuery resolves the userId from the authenticated req.entity', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {res} = createResponse();

    await controller.filterProductsQuery({query: {}, entity: {id: 'user-42'}} as any, res as any);

    assert.equal(getReceived()!.userId, 'user-42');
});

test('filterProductsBody resolves to an undefined userId for unauthenticated requests', async () => {
    const controller = new ProductController();
    const getReceived = stubFilterProducts(controller, sampleResult);
    const {res} = createResponse();

    await controller.filterProductsBody({body: {}} as any, res as any);

    assert.equal(getReceived()!.userId, undefined);
});

test('getProductById returns 400 for a non-numeric id and 404 when missing', async () => {
    const controller = new ProductController();
    (controller as any).productService.getProductById = async () => null;

    const invalid = createResponse();
    await controller.getProductById({params: {id: 'abc'}} as any, invalid.res as any);
    assert.equal(invalid.response.status, 400);

    const missing = createResponse();
    await controller.getProductById({params: {id: '1'}} as any, missing.res as any);
    assert.equal(missing.response.status, 404);
});

test('createProduct returns 201 with the created product', async () => {
    const controller = new ProductController();
    const createdProduct = {id: 5, name: 'New'};
    (controller as any).productService.createProduct = async () => createdProduct;

    const {response, res} = createResponse();
    await controller.createProduct({body: {name: 'New'}, entity: {id: 'user-1', isAdmin: true, name: 'Admin'}} as any, res as any);

    assert.equal(response.status, 201);
    assert.deepEqual(response.body, {success: true, message: 'Product created successfully', data: createdProduct});
});

test('deleteProduct returns success message without a data field', async () => {
    const controller = new ProductController();
    (controller as any).productService.deleteProduct = async () => true;

    const {response, res} = createResponse();
    await controller.deleteProduct({params: {id: '1'}} as any, res as any);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {success: true, message: 'Product soft deleted successfully'});
});
