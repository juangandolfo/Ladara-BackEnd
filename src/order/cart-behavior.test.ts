import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './order.service';

test('BE-DATA-01 validates cart item payload and rejects invalid quantity or missing fields', () => {
  assert.throws(
    () => OrderService.validateCartItemPayload({ product_id: 10, seller_id: 20, quantity: 0 }),
    /quantity must be at least 1/i,
  );

  assert.throws(
    () => OrderService.validateCartItemPayload({ cart_item_id: 1, product_id: 10, quantity: 2 }),
    /seller_id is required/i,
  );

  const item = OrderService.validateCartItemPayload({
    cart_item_id: 99,
    product_id: 10,
    seller_id: 20,
    quantity: 2,
    unit_price: 19.99,
  });

  assert.equal(item.quantity, 2);
  assert.equal(item.unit_price, 19.99);
  assert.equal(item.cart_item_id, 99);
});

test('BE-DATA-02 merges guest and authenticated cart items by product, variant and seller', () => {
  const guestCart = [
    { cart_item_id: 'g-1', product_id: 101, variant_id: 'v-2', seller_id: 's-1', quantity: 1, unit_price: 10 },
    { cart_item_id: 'g-2', product_id: 202, variant_id: 'v-1', seller_id: 's-9', quantity: 2, unit_price: 4 },
  ];

  const userCart = [
    { cart_item_id: 'u-1', product_id: 101, variant_id: 'v-2', seller_id: 's-1', quantity: 3, unit_price: 10 },
    { cart_item_id: 'u-2', product_id: 303, variant_id: 'v-4', seller_id: 's-3', quantity: 1, unit_price: 15 },
  ];

  const merged = OrderService.mergeCartItems(guestCart, userCart);

  assert.equal(merged.length, 3);
  const duplicate = merged.find(item => item.product_id === 101 && item.variant_id === 'v-2' && item.seller_id === 's-1');
  assert.ok(duplicate);
  assert.equal(duplicate?.quantity, 4);
  assert.equal(duplicate?.cart_item_id, 'u-1');
});

test('BE-ACT-01 adds or increments the same cart item without duplicating the line', () => {
  const items = [
    { cart_item_id: 1, product_id: 55, variant_id: 'blue', seller_id: 'amazon', quantity: 1, unit_price: 13 },
  ];

  const updated = OrderService.upsertCartItem(items, {
    product_id: 55,
    variant_id: 'blue',
    seller_id: 'amazon',
    quantity: 2,
    unit_price: 13,
  });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].quantity, 3);
  assert.equal(updated[0].subtotal, 39);
});

test('BE-ACT-02 calculates item count, unit count and subtotal for the current cart', () => {
  const summary = OrderService.buildCartSummary([
    { cart_item_id: 1, product_id: 1, variant_id: 'v1', seller_id: 's1', quantity: 2, unit_price: 15 },
    { cart_item_id: 2, product_id: 2, variant_id: 'v2', seller_id: 's2', quantity: 3, unit_price: 10 },
  ]);

  assert.equal(summary.uniqueItemCount, 2);
  assert.equal(summary.totalUnitCount, 5);
  assert.equal(summary.subtotal, 60);
});

test('BE-ACT-03 updates quantity, removes zero values and clamps values above stock', () => {
  const items = [
    { cart_item_id: 8, product_id: 7, variant_id: 'v-1', seller_id: 'seller-a', quantity: 2, unit_price: 9 },
  ];

  const removeResult = OrderService.updateCartItemQuantity(items, 8, 0, 10);
  assert.equal(removeResult.items.length, 0);

  const items2 = [
    { cart_item_id: 4, product_id: 9, variant_id: 'v-2', seller_id: 'seller-b', quantity: 1, unit_price: 20 },
  ];

  const stockResult = OrderService.updateCartItemQuantity(items2, 4, 12, 5);
  assert.equal(stockResult.items[0].quantity, 5);
  assert.equal(stockResult.warning, 'Maximum available stock reached');

  assert.throws(
    () => OrderService.updateCartItemQuantity(items2, 4, -1, 5),
    /quantity must be non-negative/i,
  );
});

test('BE-ACT-04 removes the selected item and returns the updated cart state', () => {
  const items = [
    { cart_item_id: 1, product_id: 15, variant_id: 'v-1', seller_id: 's-1', quantity: 1, unit_price: 12 },
    { cart_item_id: 2, product_id: 16, variant_id: 'v-2', seller_id: 's-4', quantity: 2, unit_price: 8 },
  ];

  const result = OrderService.removeCartItem(items, 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].cart_item_id, 2);
});

test('BE-ACT-05 validates promo codes and returns a discount breakdown when valid', () => {
  const invalid = () => OrderService.applyPromoToCart('BAD-CODE', 20, {
    code: 'BAD-CODE',
    discountType: 'percent',
    value: 10,
    expiresAt: '2020-01-01T00:00:00.000Z',
    minimumSpend: 50,
  });
  assert.throws(invalid, /invalid or expired/i);

  const valid = OrderService.applyPromoToCart('SAVE10', 120, {
    code: 'SAVE10',
    discountType: 'percent',
    value: 10,
    expiresAt: '2999-01-01T00:00:00.000Z',
    minimumSpend: 50,
  });

  assert.equal(valid.discountAmount, 12);
  assert.equal(valid.description, 'SAVE10 - 10% off');
});

test('BE-ACT-06 validates checkout inventory and pricing before checkout proceeds', () => {
  const items = [
    { cart_item_id: 1, product_id: 100, variant_id: 'v-1', seller_id: 'seller-a', quantity: 2, unit_price: 10 },
    { cart_item_id: 2, product_id: 101, variant_id: 'v-2', seller_id: 'seller-b', quantity: 1, unit_price: 30 },
  ];

  const valid = OrderService.validateCheckout(items, {
    100: { price: 10, stock: 5 },
    101: { price: 30, stock: 3 },
  });
  assert.equal(valid.ok, true);

  const invalid = OrderService.validateCheckout([
    { cart_item_id: 3, product_id: 105, variant_id: 'v-9', seller_id: 'seller-x', quantity: 4, unit_price: 9 },
  ], {
    105: { price: 10, stock: 2 },
  });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.conflicts[0].cart_item_id, 3);
});

test('BE-DATA-03 rejects fractional quantities and trims numeric values', () => {
  assert.throws(
    () => OrderService.validateCartItemPayload({ product_id: 10, seller_id: 20, quantity: 2.5, unit_price: 10 }),
    /quantity must be a whole number/i,
  );

  assert.throws(
    () => OrderService.validateCartItemPayload({ product_id: 10, seller_id: 20, quantity: '3.4', unit_price: 10 }),
    /quantity must be a whole number/i,
  );

  assert.equal(OrderService.validateCartItemPayload({
    product_id: ' 10 ',
    seller_id: ' seller-1 ',
    quantity: '2',
    unit_price: ' 19.99 ',
  }).product_id, 10);
});
