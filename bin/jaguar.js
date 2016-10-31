#!/usr/bin/env node

'use strict';

const jaguar = require('..');
const path = require('path');
const glob = require('glob');
const argv = process.argv;

const args = require('minimist')(argv.slice(2), {
    string: [
        'pack',
        'extract',
    ],
    alias: {
        v: 'version',
        h: 'help',
        p: 'pack',
        x: 'extract'
    },
    unknown: (cmd) => {
        const name = info().name;
        
        console.error(
            `'%s' is not a ${name} option. See '${name} --help'.`, cmd
        );
        
        process.exit(-1);
    }
});

if (args.version)
    version();
else if (args.help)
    help();
else if (args.pack)
    getName(args.pack, name => {
        main('pack', name);
    });
else if (args.extract)
    getName(args.extract, name => {
        main('extract', name);
    });
else
    help();

function main(operation, file) {
    const packer = getPacker(operation, file);
    
    packer.on('error', error => {
        console.error(error.message);
    });
    
    packer.on('progress', percent => {
        process.stdout.write(`\r${percent}%`);
    });
    
    packer.on('end', () => {
        process.stdout.write('\n');
    });
}

function getPacker(operation, file) {
    const cwd = process.cwd();
    
    if (operation === 'extract')
        return jaguar.extract(file, cwd);
    
    const to = path.join(cwd, `${file}.tar.gz`);
    
    return jaguar.pack(cwd, to, [
        file
    ]);
}

function getName(str, fn) {
    glob(str, (error, files) => {
        if (error)
            console.error(error.message);
        else if (!files.length)
            console.error('file not found');
        else
            fn(files[0]);
    });
}

function version() {
    console.log(`v${info().version}`);
}

function info() {
    return require('../package');
}

function help() {
    const bin = require('../json/bin');
    const usage = `Usage: ${info().name} [path]`;
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach(name => {
        const line = `  ${name} ${bin[name]}`;
        console.log(line);
    });
}

