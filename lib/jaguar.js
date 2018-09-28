'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const gunzip = require('gunzip-maybe');
const {inherits} = require('util');
const findit = require('findit2');
const assert = require('assert');
const {EventEmitter} = require('events');
const tar = require('tar-fs');
const tarStream = require('tar-stream');
const pipe = require('pipe-io');

inherits(Jaguar, EventEmitter);

module.exports = jaguar;
module.exports.pack = jaguar('pack');
module.exports.extract = jaguar('extract');

function check(from, to, files) {
    assert(typeof from === 'string', 'from should be a string!');
    assert(/string|object/.test(typeof to), 'to should be string or object!');
    
    if (arguments.length > 2)
        assert(Array.isArray(files), 'files should be an array!');
}

function checkOperation(operation) {
    if (!/^(pack|extract)$/.test(operation))
        throw Error('operations: pack or extract only!');
}

function jaguar(operation) {
    checkOperation(operation);
    
    return (from, to, files) => {
        return new Jaguar(operation, from, to, files);
    };
}

function Jaguar(operation, from, to, files) {
    if (operation === 'pack')
        check(from, to, files);
    else
        check(from, to);
    
    process.nextTick(() => {
        EventEmitter.call(this);
        this._i = 0;
        this._n = 0;
        
        this._percent = 0;
        this._percentPrev = 0;
        
        this._from = from;
        this._to = to;
        
        switch(operation) {
        case 'pack':
            this._names     = files.slice();
            
            if (!files.length)
                return this._emitError(Error('Nothing to pack!'));
            
            this._parallel(from, files, () => {
                if (this._wasError)
                    return;
                
                if (this._abort)
                    return this.emit('end');
                
                this._pack();
            });
            break;
        
        case 'extract':
            this._parse(from, (error) => {
                if (error)
                    return this._emitError(error);
                
                if (!this._n)
                    return this._emitError(Error('No entries found'));
                
                return this._extract();
            });
            break;
        }
    });
}

Jaguar.prototype.abort = function() {
    this._abort = true;
};

Jaguar.prototype._emitError = function(e) {
    this._wasError = true;
    this.emit('error', e);
}

Jaguar.prototype._parallel = function(from, files, callback) {
    let i = files.length;
    
    const fn = () => {
        if (!--i)
            callback();
    };
    
    files.forEach(name => {
        const full = path.join(from, name);
        
        this._findFiles(full, fn);
    });
};

Jaguar.prototype._findFiles = function(filename, fn) {
    const finder = findit(filename);
    
    const inc = () => {
        ++this._n;
    };
    
    finder.on('file', inc);
    finder.on('error', (error) => {
        this._emitError(error);
    });
    
    finder.on('directory', inc);
    finder.on('link', inc);
    finder.on('end', fn);
};

Jaguar.prototype._pack = function() {
    this.emit('start');
    
    const from = this._from;
    const to = this._to;
    
    const streamFile = typeof to === 'object' ?
        to : fs.createWriteStream(to);
    
    const streamZip = zlib.createGzip();
    
    const streamTar = tar.pack(from, {
        entries : this._names,
        map: (header) => {
            this._progress();
            this.emit('file', header.name);
            
            return header;
        }
    });
    
    pipe([
        streamTar,
        streamZip,
        streamFile
    ], (error) => {
        if (error)
            return this._emitError(error);
        
        if (!this._abort)
            return this.emit('end');
        
        this._unlink(to);
    });
};

Jaguar.prototype._unlink = function(to) {
    fs.unlink(to, (error) => {
        if (error)
            return this._emitError(error);
        
        this.emit('end');
    });
};

Jaguar.prototype._extract  = function() {
    this.emit('start');
    
    const from = this._from;
    const to = this._to;
    const streamFile  = fs.createReadStream(from);
    const streamUnzip = gunzip();
    const streamUntar = tar.extract(to);
    
    streamUntar.on('entry', header => {
        this._progress();
        this.emit('file', header.name);
    });
    
    streamUntar.on('finish', () => {
        this.emit('end');
    });
    
    pipe([
        streamFile,
        streamUnzip,
        streamUntar
    ], (e) => {
        e && this._emitError(e);
    });
};

Jaguar.prototype._parse = function(name, callback) {
    const streamFile  = fs.createReadStream(name);
    const streamUnzip = gunzip();
    const streamParse = tarStream.extract();
    
    streamParse.on('entry', (header, stream, callback) => {
        stream.on('end', () => {
            ++this._n;
            
            callback();
        });
        
        stream.resume();
    });
    
    streamParse.on('finish', callback);
    
    pipe([
        streamFile,
        streamUnzip,
        streamParse
    ], (error) => {
        error && callback(error);
    });
};

Jaguar.prototype._progress = function() {
    ++this._i;
    
    const value = Math.round(this._i * 100 / this._n);
    
    this._percent = value;
    
    if (value !== this._percentPrev) {
        this._percentPrev = value;
        this.emit('progress', value);
    }
};

