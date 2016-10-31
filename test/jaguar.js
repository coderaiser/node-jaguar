'use strict';

const test = require('tape');
const jaguar = require('..');

test('jaguar: no args', (t) => {
    t.throws(jaguar, /operations: pack or extract only!/, 'should throw when bad operation');
    t.end();
});

