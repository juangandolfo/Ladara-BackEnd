import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizePrice, sanitizeString} from './normalize';

test('sanitizePrice rounds to 2 decimal places like Number(value.toFixed(2))', () => {
    assert.equal(sanitizePrice(19.999), 20);
    assert.equal(sanitizePrice(10.005), Number((10.005).toFixed(2)));
    assert.equal(sanitizePrice(0), 0);
    assert.equal(sanitizePrice(12.3), 12.3);
});

test('sanitizePrice preserves negative values (clamping is the caller\'s responsibility)', () => {
    assert.equal(sanitizePrice(-5.126), -5.13);
});

test('sanitizeString trims whitespace and coerces nullish/number values', () => {
    assert.equal(sanitizeString('  SAVE10  '), 'SAVE10');
    assert.equal(sanitizeString(null), '');
    assert.equal(sanitizeString(undefined), '');
    assert.equal(sanitizeString(42), '42');
});

test('sanitizeString supports uppercasing after trimming', () => {
    assert.equal(sanitizeString('  save10  ', {uppercase: true}), 'SAVE10');
    assert.equal(sanitizeString('already-upper', {uppercase: false}), 'already-upper');
});
