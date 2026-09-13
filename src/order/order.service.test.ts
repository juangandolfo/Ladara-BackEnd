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
});
