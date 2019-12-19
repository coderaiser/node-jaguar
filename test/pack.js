'use strict';

const {tmpdir} = require('os');
const {join} = require('path');
const fs = require('fs');

const {reRequire} = require('mock-require');

const {
    readFileSync,
    unlinkSync,
    existsSync,
} = fs;

const test = require('supertape');
const {pack} = require('..');

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

test('jaguar: pack: error: read', (t) => {
    const expect = 'ENOENT: no such file or directory, lstat \'hello/world\'';
    const packer = pack('hello', 'hello.tar.gz', [
        'world',
    ]);
    
    packer.on('error', (e) => {
        t.equal(e.message, expect, 'should emit error when file not found');
        t.end();
    });
    
    packer.on('end', () => {
        t.fail('should not emit end event when error');
    });
});

test('jaguar: pack: error: write', (t) => {
    const expect = 'EACCES: permission denied, open \'/hello.tar.gz\'';
    const from = join(__dirname, 'fixture');
    const packer = pack(from, '/hello.tar.gz', [
        'jaguar.txt',
    ]);
    
    packer.on('error', (e) => {
        t.equal(e.message, expect, 'should emit error when file not found');
        t.end();
    });
});

test('jaguar: pack', (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const fixture = join(__dirname, 'fixture');
    const packer = pack(fixture, to, [
        'jaguar.txt',
    ]);
    
    packer.on('end', () => {
        const fileTo = readFileSync(to);
        
        unlinkSync(to);
        t.ok(fileTo.length, 'should pack file');
        t.end();
    });
});

test('jaguar: pack: abort', (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const fixture = join(__dirname, 'fixture');
    const packer = pack(fixture, to, [
        'jaguar.txt',
    ]);
    
    packer.abort();
    
    packer.on('end', () => {
        t.notOk(existsSync(to), 'should not create archive');
        t.end();
    });
});

test('jaguar: pack: abort', (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const fixture = join(__dirname, 'fixture');
    const packer = pack(fixture, to, [
        'jaguar.txt',
    ]);
    
    packer.abort();
    
    packer.on('end', () => {
        t.notOk(existsSync(to), 'should not create archive');
        t.end();
    });
});

test('jaguar: pack: abort: fast', (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const fixture = join(__dirname, 'fixture');
    const packer = pack(fixture, to, [
        'jaguar.txt',
    ]);
    
    packer.abort();
    
    packer.on('end', () => {
        t.notOk(existsSync(to), 'should not create archive');
        t.end();
    });
});

test('jaguar: pack: abort: unlink', (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const dir = join(__dirname, 'fixture');
    const packer = pack(dir, to, [
        'jaguar.txt',
    ]);
    
    const {unlink} = fs.promises;
    
    fs.promises.unlink = async () => {};
    
    packer.on('start', () => {
        packer.abort();
    });
    
    packer.on('end', () => {
        fs.promises.unlink = unlink;
        t.pass('should emit end');
        t.end();
    });
});

test('jaguar: pack: unlink', async (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const dir = join(__dirname, 'fixture');
    
    const {unlink} = fs.promises;
    
    fs.promises.unlink = async () => {};
    
    const {pack} = reRequire('..');
    const packer = pack(dir, to, [
        'jaguar.txt',
    ]);
    
    packer.once('end', () => {
        fs.promises.unlink = unlink;
        t.pass('should emit end');
        t.end();
    });
    
    await packer._unlink(to);
});

test('jaguar: pack: unlink: error', async (t) => {
    const to = join(tmpdir(), `${Math.random()}.tar.gz`);
    const dir = join(__dirname, '..');
    
    const {unlink} = fs.promises;
    
    fs.promises.unlink = async () => {
        throw Error('Can not remove');
    };
    
    const {pack} = reRequire('..');
    const packer = pack(dir, to, [
        '.git',
    ]);
    
    packer.on('error', (e) => {
        fs.promises.unlink = unlink;
        
        t.ok(e.message, 'Can not remove', 'should emit error');
        t.end();
    });
    
    await packer._unlink(to);
});

