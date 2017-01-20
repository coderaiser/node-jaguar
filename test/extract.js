'use strict';

const {EventEmitter} = require('events');
const {tmpdir} = require('os');
const {
    sep,
    join
} = require('path');
const {
    readFileSync,
    unlinkSync,
    rmdirSync,
    mkdtempSync
} = require('fs');

const test = require('tape');
const {extract}= require('..');

test('jaguar: extract: no args', (t) => {
    t.throws(extract, /from should be a string!/, 'should throw when no args');
    t.end();
});

test('jaguar: extract: to', (t) => {
    const fn = () => extract('hello');
    t.throws(fn, /to should be string or object!/, 'should throw when no to');
    t.end();
});

test('jaguar: extract: error: file not found', (t) => {
    const expect = 'ENOENT: no such file or directory, open \'hello.tar.gz\'';
    const extracter = extract('hello.tar.gz', 'hello');
    
    extracter.on('error', (e) => {
        t.equal(e.message,  expect, 'should emit error when file not found');
        t.end();
    });
});

test('jaguar: extract', (t) => {
    const to = mkdtempSync(tmpdir() + sep);
    const fixture = join(__dirname, 'fixture');
    const from = join(fixture, 'jaguar.txt.tar.gz');
    const extracter = extract(from, to);
    
    extracter.on('end', () => {
        const pathUnpacked = join(to, 'jaguar.txt');
        const pathFixture= join(fixture, 'jaguar.txt');
        
        const fileUnpacked = readFileSync(pathUnpacked);
        const fileFixture = readFileSync(pathFixture);
        
        unlinkSync(pathUnpacked);
        rmdirSync(to);
        
        t.deepEqual(fileFixture, fileUnpacked, 'should extract file');
        t.end();
    });
});

test('jaguar: extract: gz: invalid tar header', (t) => {
    const to = mkdtempSync(tmpdir() + sep);
    const fixture = join(__dirname, 'fixture');
    const from = join(fixture, 'awk.1.gz');
    const extracter = extract(from, to);
    
    extracter.on('error', (e) => {
        const msg = 'Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?';
        t.equal(e.message, msg, 'should emit error');
        t.end();
        rmdirSync(to);
    });
});

