import test from 'node:test';
import assert from 'node:assert/strict';
import {PromoService} from './promo.service';

test('PromoService.apply computes a percent discount for a valid, active promo', () => {
    const result = PromoService.apply('SAVE10', 120, {
        discountType: 'percent',
        value: 10,
        active: true,
    });

    assert.equal(result.discountAmount, 12);
    assert.match(result.description, /SAVE10 - 10% off/);
});

test('PromoService.apply computes a fixed discount capped at the subtotal', () => {
    const result = PromoService.apply('FLAT50', 30, {
        discountType: 'fixed',
        value: 50,
    });

    assert.equal(result.discountAmount, 30);
});

test('PromoService.apply rejects codes that do not match, are inactive, expired, or under minimum spend', () => {
    assert.throws(() => PromoService.apply('BAD-CODE', 20, {code: 'SAVE10', value: 10}));
    assert.throws(() => PromoService.apply('SAVE10', 20, {code: 'SAVE10', value: 10, active: false}));
    assert.throws(() => PromoService.apply('SAVE10', 20, {
        code: 'SAVE10',
        value: 10,
        expiresAt: '2000-01-01T00:00:00.000Z',
    }));
    assert.throws(() => PromoService.apply('SAVE10', 20, {
        code: 'SAVE10',
        value: 10,
        minimumSpend: 100,
    }));
});

test('PromoService.apply rejects an unknown discount type and a non-positive discount value', () => {
    assert.throws(() => PromoService.apply('SAVE10', 100, {code: 'SAVE10', discountType: 'mystery', value: 10}));
    assert.throws(() => PromoService.apply('SAVE10', 100, {code: 'SAVE10', value: 0}));
});
