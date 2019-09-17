'use strict';

const jaguar = require('..');
const {join} = require('path');

const fn = new Promise((resolve,reject) => {
    const from = './broken.tar.gz';
    const extract = jaguar.extract(from, join(from + '-expanded'));
    extract.on('error', (error) => {
        reject(error);
    });
    extract.on('end', () => {
        resolve();
    });
    extract.on('file', (name) => {
        console.log(name);
    });
    extract.on('progress', (percent) => {
        console.log(percent + '%');
    });
    console.log('Unzipping results promised. Will be at ' + from + '-expanded');
});

fn.then(console.log).catch(console.error);
