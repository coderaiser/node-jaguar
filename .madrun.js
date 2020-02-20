'use strict';

const {run} = require('madrun');

const {
    NODE_OPTIONS = '',
} = process.env;

process.env.NODE_OPTIONS = `${NODE_OPTIONS} --unhandled-rejections=strict`;

module.exports = {
    'lint': () => 'putout bin lib test .madrun.js',
    'fix:lint': () => run('lint', '--fix'),
    'test': () => 'tape \'test/**/*.js\'',
    'coverage': () => 'nyc npm test',
    'report': () => 'nyc report --reporter=text-lcov | coveralls',
    'watcher': () => 'nodemon -w test -w lib --exec',
    'watch:test': () => run('watcher', 'npm test'),
    'watch:coverage': () => run('watcher', 'npm run coverage'),
};

