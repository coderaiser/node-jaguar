'use strict';

const {EventEmitter} = require('events');
const {tmpdir} = require('os');
const {join} = require('path');
const {
    readFileSync,
    unlinkSync
} = require('fs');

const test = require('tape');
const {pack}= require('..');

test('jaguar: pack: no args', (t) => {
    t.throws(pack, /from should be a string!/, 'should throw when no args');
    t.end();
});

test('jaguar: pack: to', (t) => {
    const fn = () => pack('hello');
    t.throws(fn, /to should be string or object!/, 'should throw when no to');
    t.end();
});

test('jaguar: pack: files', (t) => {
    const fn = () => pack('hello', 'world');
    
    t.throws(fn, /files should be an array!/, 'should throw when no files');
    t.end();
});

test('jaguar: pack: error: empty file list', (t) => {
    const packer = pack('hello', 'world', []);
    
    packer.on('error', (e) => {
        t.equal(e.message, 'Nothing to pack!', 'should emit error when file list is empty');
        t.end();
    });
});

test('jaguar: pack: error: file not found', (t) => {
    const expect = 'ENOENT: no such file or directory, lstat \'hello/world\'';
    const packer = pack('hello', 'hello.tar.gz', [
        'world'
    ]);
    
    packer.on('error', (e) => {
        t.equal(e.message,  expect, 'should emit error when file not found');
        t.end();
    });
});

test('jaguar: pack: ', (t) => {
    const expect = 'ENOENT: no such file or directory, lstat \'hello/world\'';
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const fixture = join(__dirname, 'fixture');
    const packer = pack(fixture, to, [
        'jaguar.txt'
    ]);
    
    packer.on('end', () => {
        const from = join(fixture, 'jaguar.txt.tar.gz');
        const fileTo = readFileSync(to);
        const fileFrom  = readFileSync(from);
        
        unlinkSync(to);
        t.deepEqual(fileTo, fileFrom, 'should pack file');
        t.end();
    });
});

