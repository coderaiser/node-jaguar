(function() {
    'use strict';
    
    var fs          = require('fs'),
        path        = require('path'),
        zlib        = require('zlib'),
        util        = require('util'),
        
        findit      = require('findit'),
        assert      = require('assert'),
        Emitter     = require('events').EventEmitter,
        
        tar         = require('tar-fs'),
        tarStream   = require('tar-stream'),
        pipe        = require('pipe-io');
        
    util.inherits(Jaguar, Emitter);
        
    module.exports.pack     = jaguar('pack');
    module.exports.extract  = jaguar('extract');
    
    function check(from, to, files) {
        assert(typeof from === 'string', 'from should be string!');
        assert(/string|object/.test(typeof to), 'to should be string or object!');
        
        if (arguments.length > 2)
            assert(Array.isArray(files), 'array should be array!');
    }
    
    function jaguar(operation) {
        return function(from, to, files) {
            var emitter;
            
            emitter = new Jaguar(operation, from, to, files);
            
            return emitter;
        };
    }
    
    function Jaguar(operation, from, to, files) {
        var self            = this;
        
        this._i             = 0;
        this._n             = 0;
        
        this._percent       = 0;
        this._percentPrev   = 0;
        
        this._from          = from;
        this._to            = to;
        
        switch(operation) {
        case 'pack':
            this._names     = files.slice();
            check(from, to, files);
            
            this._parallel(from, files, function() {
                if (self._abort)
                    self.emit('end');
                else
                    self._pack();
            });
            break;
        
        case 'extract':
            check(from, to);
            this._parse(from, function(error) {
                if (!error) {
                    self._extract();
                } else {
                    self.emit('error', error);
                    self.emit('end');
                }
            });
            break;
        
        default:
            throw Error('operations: pack or extract only');
        }
    }
    
    Jaguar.prototype.abort     = function() {
        this._abort = true;
    };
    
    Jaguar.prototype._parallel  = function(from, files, callback) {
        var self    = this,
            i       = files.length,
            fn      = function() {
                if (!--i)
                    callback();
            };
        
        files.forEach(function(name) {
            var full = path.join(from, name);
            
            self._findFiles(full, fn);
        });
    };
    
    Jaguar.prototype._findFiles = function(filename, fn) {
        var self        = this,
            
            finder      = findit(filename),
            
            inc         = function() {
                ++self._n;
            };
        
        finder.on('file', inc);
        finder.on('error', function(error) {
            self.emit('error', error);
            self.abort();
        });
        
        finder.on('directory', inc);
        finder.on('link', inc);
        
        finder.on('end', function() {
            fn();
        });
    };
    
    Jaguar.prototype._pack = function() {
        var self        = this,
            from        = this._from,
            to          = this._to,
            
            streamFile  = typeof to === 'object' ?
                to : fs.createWriteStream(to),
            
            streamZip   = zlib.createGzip(),
            streamTar   = tar.pack(from, {
                entries : this._names,
                map: function(header) {
                    self._progress();
                    self.emit('file', header.name);
                    
                    return header;
                }
            });
            
            pipe([
                streamTar,
                streamZip,
                streamFile
            ], function(error) {
                if (error)
                    self.emit('error', error);
                
                if (!self._abort)
                    self.emit('end');
                else
                    fs.unlink(to, function(error) {
                        if (error)
                            self.emit('error', error);
                        
                        self.emit('end');
                    });
            });
    };
    
    Jaguar.prototype._extract  = function() {
        var self        = this,
            from        = this._from,
            to          = this._to,
            streamFile  = fs.createReadStream(from),
            streamUnzip = zlib.createGunzip(),
            streamUntar = tar.extract(to);
            
        streamUntar.on('entry', function(header) {
            self._progress();
            self.emit('file', header.name);
        });
        
        streamUntar.on('finish', function() {
            self.emit('end');
        });
        
        pipe([
            streamFile,
            streamUnzip,
            streamUntar
        ], function(error) {
            if (error)
                self.emit('error', error);
        });
    };
    
    Jaguar.prototype._parse     = function(name, callback) {
        var self        = this,
            wasError,
            
            streamFile  = fs.createReadStream(name),
            streamUnzip = zlib.createGunzip(),
            streamParse = tarStream.extract();
        
        streamParse.on('entry', function(header, stream, callback) {
            stream.on('end', function() {
                ++self._n;
                
                callback();
            });
            
            stream.resume();
        });
        
        streamParse.on('finish', function() {
            if (!wasError)
                callback();
        });
        
        pipe([
            streamFile,
            streamUnzip,
            streamParse
        ], function(error) {
            if (error) {
                wasError = true;
                callback(error);
            }
        });
    };
    
    Jaguar.prototype._progress  = function() {
        var value;
        
        ++this._i;
        
        value = Math.round(this._i * 100 / this._n);
        
        this._percent = value;
        
        if (value !== this._percentPrev) {
            this._percentPrev = value;
            this.emit('progress', value);
        }
    };
    
})();
