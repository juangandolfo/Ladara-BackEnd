import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BusinessSettingService } from '../business-settings/business-setting.service';
import { OrderStatus } from './types/order-status.type';

test('OrderService.calculateCartTotal adds shipping cost after tax exactly once', () => {
  const total = OrderService.calculateCartTotal(100, 0, 8, 8);
  assert.equal(total, 116);
});

test('OrderService.calculateCartTotal keeps zero shipping as free delivery', () => {
  const total = OrderService.calculateCartTotal(100, 0, 8, 0);
  assert.equal(total, 108);
});

test('BusinessSettingService.normalizeShippingCost rejects negatives and malformed values', () => {
  assert.throws(() => BusinessSettingService.normalizeShippingCost(-1));
  assert.throws(() => BusinessSettingService.normalizeShippingCost('not-a-number'));
  assert.equal(BusinessSettingService.normalizeShippingCost('15.50'), 15.5);
});

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
  return { response, res };
}

test('GET current order returns numeric shippingCost for an empty authenticated cart', async () => {
  const user = { id: 'user-1', name: 'User', isAdmin: false } as any;
  const order = {
    id: 123,
    user,
    status: OrderStatus.CART,
    total: 0,
    shippingCost: '0.00',
    createdAt: new Date(),
    items: [],
  } as any;
  let findOptions: any;
  const orderRepo: any = {
    find: async (options: any) => {
      findOptions = options;
      return [order];
    },
    save: async (entity: any) => entity,
    findOne: async () => null,
    create: (value: any) => value,
  } as any;
  const businessSettingRepository: any = {
    findOneBy: async () => ({ value: '8.00' }),
    save: async (setting: any) => setting,
    create: (value: any) => value,
  } as any;
  const controller = new OrderController(
    orderRepo,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
    new BusinessSettingService(businessSettingRepository),
  );
  const { response, res } = createResponse();

  await controller.getCurrentOrder({ entity: user } as any, res as any);

  assert.equal(response.status, 200);
  assert.deepEqual(findOptions.where, { user: { id: 'user-1' }, status: OrderStatus.CART });
  const body = response.body as any;
  assert.equal(body.data[0].shippingCost, 8);
  assert.equal(typeof body.data[0].shippingCost, 'number');
  assert.deepEqual(body.data[0].items, []);
  assert.equal(order.shippingCost, 8);
  assert.equal(order.total, 8);
});

test('active cart refreshes shipping while completion keeps the cart snapshot', async () => {
  const order = {
    id: 123,
    user: { id: 'user-1' },
    status: OrderStatus.CART,
    total: 0,
    shippingCost: '0.00',
    createdAt: new Date(),
    items: [],
  } as any;
  let savedOrder = order;
  const orderRepo: any = {
    find: async () => [order],
    findOne: async () => savedOrder,
    save: async (entity: any) => {
      savedOrder = entity;
      return entity;
    },
    create: (value: any) => value,
  } as any;
  const businessSettingRepository: any = {
    findOneBy: async () => ({ value: '8.00' }),
    save: async (setting: any) => setting,
    create: (value: any) => value,
  } as any;
  const service = new OrderService(
    orderRepo,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
    new BusinessSettingService(businessSettingRepository),
  );

  await service.getCurrentOrder('user-1');
  assert.equal(order.shippingCost, 8);

  businessSettingRepository.findOneBy = async () => ({ value: '12.00' });
  const completed = await service.markOrderCompleted(123);

  assert.equal(completed?.shippingCost, 8);
  assert.equal(completed?.status, OrderStatus.COMPLETED);
  assert.ok(completed?.completedAt instanceof Date);
});

test('admin dashboard summary counts payment, preparing, and recently completed orders', async () => {
  const countOptions: any[] = [];
  const orderRepo: any = {
    count: async (options: any) => {
      countOptions.push(options);
      return [2, 3, 4][countOptions.length - 1];
    },
  };
  const service = new OrderService(
    orderRepo,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );

  const summary = await service.getAdminDashboardSummary();

  assert.deepEqual(summary, {
    pendingPaymentCount: 2,
    preparingCount: 3,
    completedLast30DaysCount: 4,
  });
  assert.deepEqual(countOptions[0].where, {status: OrderStatus.PENDING_PAYMENT});
  assert.deepEqual(countOptions[1].where, {status: OrderStatus.PREPARING});
  assert.equal(countOptions[2].where.status, OrderStatus.COMPLETED);
  const completedAtRange = countOptions[2].where.completedAt;
  assert.equal(completedAtRange.type, 'between');
  const [from, to] = completedAtRange.value as Date[];
  assert.ok(to instanceof Date);
  assert.ok(from instanceof Date);
  assert.equal(to.getTime() - from.getTime(), 30 * 24 * 60 * 60 * 1000);
});

test('setting an item quantity to zero returns the removed item as a successful update', async () => {
  const item = {
    id: 7,
    quantity: 1,
    price: 12,
    product: { id: 4 },
    order: {
      id: 9,
      status: OrderStatus.CART,
      user: { id: 'user-1' },
      items: [],
      shippingCost: 8,
    },
  } as any;
  const itemRepo: any = {
    findOne: async () => item,
    delete: async () => undefined,
    save: async (entity: any) => entity,
  };
  const orderRepo: any = {
    save: async (entity: any) => entity,
  };
  const service = new OrderService(
    orderRepo,
    itemRepo,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );

  const removedItem = await service.updateItemQuantity(7, 0);

  assert.equal(removedItem, item);
});

test('emptying the cart removes all items and leaves no items on the active cart', async () => {
  const order = {
    id: 9,
    status: OrderStatus.CART,
    user: { id: 'user-1' },
    items: [] as any[],
    shippingCost: 8,
    total: 0,
  } as any;

  const item1 = { id: 1, quantity: 2, price: 10, product: { id: 1 }, order };
  const item2 = { id: 2, quantity: 1, price: 8, product: { id: 2 }, order };
  order.items = [item1, item2];

  const itemRepo: any = {
    findOne: async ({ where }: any) => [item1, item2].find((item) => item.id === where.id) ?? null,
    delete: async () => undefined,
    save: async (entity: any) => entity,
  };
  const orderRepo: any = {
    save: async (entity: any) => entity,
  };
  const service = new OrderService(
    orderRepo,
    itemRepo,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );

  const first = await service.updateItemQuantity(1, 0);
  const second = await service.updateItemQuantity(2, 0);

  assert.equal(first?.id, 1);
  assert.equal(second?.id, 2);
  assert.equal(order.items.length, 0);
  assert.deepEqual(order.items, []);
});

test('clearCurrentCart removes every item in one bulk operation and keeps the active cart', async () => {
  const user = { id: 'user-1' } as any;
  const order = {
    id: 9,
    status: OrderStatus.CART,
    user,
    items: Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      orderId: 9,
      quantity: index === 0 ? 3 : 1,
      price: 10,
      product: { id: index + 1 },
    })),
    shippingCost: 0,
    total: 130,
  } as any;
  let deleteCriteria: any;
  let savedOrder: any;
  const itemRepo: any = {
    delete: async (criteria: any) => {
      deleteCriteria = criteria;
    },
  };
  const orderRepo: any = {
    findOne: async (options: any) => {
      assert.deepEqual(options.where, { user: { id: user.id }, status: OrderStatus.CART });
      return order;
    },
    save: async (entity: any) => {
      savedOrder = entity;
      return entity;
    },
  };
  const service = new OrderService(
    orderRepo,
    itemRepo,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
    { getShippingCostForSubtotal: async (subtotal: number) => subtotal === 0 ? 8 : 0 } as any,
  );

  await service.clearCurrentCart(user.id);

  assert.deepEqual(deleteCriteria, { orderId: 9 });
  assert.deepEqual(order.items, []);
  assert.equal(order.status, OrderStatus.CART);
  assert.equal(order.shippingCost, 8);
  assert.equal(order.total, 8);
  assert.equal(savedOrder, order);
});

test('clearCurrentCart is a no-op when the user has no active cart', async () => {
  let deleteCalled = false;
  let saveCalled = false;
  const service = new OrderService(
    { findOne: async () => null, save: async () => { saveCalled = true; } } as any,
    { delete: async () => { deleteCalled = true; } } as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );

  await service.clearCurrentCart('user-1');

  assert.equal(deleteCalled, false);
  assert.equal(saveCalled, false);
});

test('clearCurrentCart endpoint returns success for an authenticated request', async () => {
  const controller = new OrderController(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );
  (controller as any).orderService.clearCurrentCart = async () => undefined;
  const { response, res } = createResponse();

  await controller.clearCurrentCart({ entity: { id: 'user-1' } } as any, res as any);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { success: true, message: 'Cart emptied successfully' });
});

test('frontend cart contract exposes product stock and supports coupon plus checkout validation', async () => {
  const user = { id: 'user-1', name: 'User', isAdmin: false } as any;
  const order = {
    id: 123,
    user,
    status: OrderStatus.CART,
    total: 0,
    shippingCost: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [{
      id: 77,
      quantity: 2,
      price: 20,
      product: { id: 4, name: 'Tea', price: 20, stock: 5, image: 'img', category: 'drinks', description: 'desc' },
    }],
  } as any;

  const orderRepo: any = {
    find: async () => [order],
    save: async (entity: any) => entity,
    findOne: async (criteria: any) => (criteria?.where?.id === order.id ? order : null),
    create: (value: any) => value,
  };
  const controller = new OrderController(
    orderRepo,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
    new BusinessSettingService({ findOneBy: async () => ({ value: '8.00' }), save: async (setting: any) => setting, create: (value: any) => value } as any),
  );

  const { response, res } = createResponse();
  await controller.getCurrentOrder({ entity: user } as any, res as any);

  assert.equal(response.body.data[0].items[0].product.stock, 5);
  assert.equal(response.body.data[0].items[0].price, 20);

  const couponResponse = createResponse();
  await controller.validateCoupon({ body: { code: 'SAVE5' } } as any, couponResponse.res as any);
  assert.equal(couponResponse.response.status, 200);
  assert.equal(couponResponse.response.body.data.valid, true);
  assert.equal(couponResponse.response.body.data.discountAmount, 5);

  const checkoutResponse = createResponse();
  await controller.validateOrder({ params: { id: '123' }, body: {} } as any, checkoutResponse.res as any);
  assert.equal(checkoutResponse.response.status, 200);
  assert.equal(checkoutResponse.response.body.data.valid, true);
  assert.deepEqual(checkoutResponse.response.body.data.rejectedItems, []);
});

test('initiateCheckout persists billing details and payment method on the owned order', async () => {
  const user = { id: 'user-1' } as any;
  const order = {
    id: 123,
    user,
    status: OrderStatus.CART,
    total: 0,
    shippingCost: 5,
    items: [{ id: 1, quantity: 2, price: 10, product: { id: 4 } }],
  } as any;
  let lookup: any;
  const orderRepo: any = {
    findOne: async (options: any) => {
      lookup = options;
      return order;
    },
    save: async (entity: any) => entity,
  };
  const service = new OrderService(
    orderRepo,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );

  const checkedOutOrder = await service.initiateCheckout(123, user.id, {
    fullName: ' Jane Doe ',
    addressLine1: ' 123 Main Street ',
    city: ' Springfield ',
    postalCode: ' 62701 ',
    country: ' US ',
  }, ' card ');

  assert.deepEqual(lookup.where, { id: 123, user: { id: 'user-1' } });
  assert.equal(checkedOutOrder?.id, 123);
  assert.deepEqual(checkedOutOrder?.billingAddress, {
    fullName: 'Jane Doe',
    addressLine1: '123 Main Street',
    city: 'Springfield',
    postalCode: '62701',
    country: 'US',
  });
  assert.equal(checkedOutOrder?.paymentMethod, 'card');
  assert.ok(checkedOutOrder?.checkoutAt instanceof Date);
  assert.equal(checkedOutOrder?.status, OrderStatus.PENDING_PAYMENT);
  assert.equal(checkedOutOrder?.total, 26.6);
});

test('initiateCheckout rejects empty carts and orders that already left cart state', async () => {
  const order = {
    id: 123,
    user: { id: 'user-1' },
    status: OrderStatus.CART,
    items: [],
  } as any;
  const service = new OrderService(
    { findOne: async () => order, save: async (entity: any) => entity } as any,
    {} as any,
    {} as any,
    {} as any,
    { listDiscountsByUser: async () => [] } as any,
  );
  const address = { fullName: 'Jane Doe', addressLine1: '123 Main Street', city: 'Springfield', postalCode: '62701', country: 'US' };

  await assert.rejects(service.initiateCheckout(123, 'user-1', address, 'card'), { message: 'ORDER_EMPTY' });
  order.status = OrderStatus.PREPARING;
  order.items = [{ quantity: 1, price: 10, product: { id: 4 } }];
  await assert.rejects(service.initiateCheckout(123, 'user-1', address, 'card'), { message: 'ORDER_NOT_IN_CART' });
});
