import test from 'node:test';
import assert from 'node:assert/strict';
import {CartValidationService} from './cart-validation.service';

test('CartValidationService.validate normalizes a well-formed cart item', () => {
    const result = CartValidationService.validate({
        product_id: ' 10 ',
        seller_id: ' 20 ',
        quantity: ' 3 ',
        unit_price: ' 9.999 ',
    });

    assert.equal(result.product_id, 10);
    assert.equal(result.productId, 10);
    assert.equal(result.seller_id, '20');
    assert.equal(result.sellerId, '20');
    assert.equal(result.quantity, 3);
    assert.equal(result.unit_price, 10);
    assert.equal(result.price, 10);
    assert.equal(result.subtotal, 30);
});

test('CartValidationService.validate preserves variant id fields when present', () => {
    const result = CartValidationService.validate({
        product_id: 1,
        seller_id: 2,
        quantity: 1,
        unit_price: 5,
        variant_id: 'red',
    });

    assert.equal(result.variant_id, 'red');
    assert.equal(result.variantId, 'red');
});

test('CartValidationService.validate rejects missing payload, product_id, seller_id', () => {
    assert.throws(() => CartValidationService.validate(undefined as any), /Cart item payload is required/);
    assert.throws(
        () => CartValidationService.validate({seller_id: 1, quantity: 1, unit_price: 1}),
        /product_id is required/,
    );
    assert.throws(
        () => CartValidationService.validate({product_id: 1, quantity: 1, unit_price: 1}),
        /seller_id is required/,
    );
});

test('CartValidationService.validate rejects fractional or non-positive quantities and negative prices', () => {
    assert.throws(
        () => CartValidationService.validate({product_id: 1, seller_id: 1, quantity: 0, unit_price: 1}),
        /quantity must be at least 1/,
    );
    assert.throws(
        () => CartValidationService.validate({product_id: 1, seller_id: 1, quantity: 1.5, unit_price: 1}),
        /quantity must be a whole number/,
    );
    assert.throws(
        () => CartValidationService.validate({product_id: 1, seller_id: 1, quantity: 1, unit_price: -1}),
        /unit_price must be a valid non-negative number/,
    );
});
