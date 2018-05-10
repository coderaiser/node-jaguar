# Jaguar [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

Pack and extract .tar.gz archives with emitter.

## Global

`Jaguar` could be installed global with

```
npm i jaguar -g
```

And used this way:

```
Usage: jaguar [filename]
Options:
  -h, --help      display this help and exit
  -v, --version   output version information and exit
  -p, --pack      pack files to archive
  -x, --extract   extract files from archive
```

## Local

`Jaguar` could be used localy. It will emit event on every packed/extracted file.
Good for making progress bars.

### Install

```
npm i jaguar --save
```

### How to use?

#### pack(from, to, names)

- `from`  - **string** directory that would be packed
- `to`    - **string** or **stream**, name of archive
- `names` - **array** of names in directory `from` that would be packed.

```js
const jaguar = require('jaguar');
const path = require('path');
const cwd = process.cwd();
const name = 'pipe.tar.gz';
const from = cwd + '/pipe-io';
const to = path.join(cwd, name);

const pack = jaguar.pack(from, to, [
    'LICENSE',
    'README.md',
    'package.json'
]);

pack.on('file', (name) => {
    console.log(name);
});

pack.on('start', () => {
    console.log('start of packing');
});

pack.on('progress', (percent) => {
    console.log(percent + '%');
});

pack.on('error', (error) => {
    console.error(error);
});

pack.on('end', () => {
    console.log('done');
});
```

#### extract(from, to)

- `from` - path to **.tar.gz** archive
- `to` - path to directory where files would be stored.

```js
const jaguar = require('jaguar');
const path = require('path');
const cwd = process.cwd();
const name = 'pipe.tar.gz';
const to = cwd + '/pipe-io';
const from = path.join(cwd, name);

const extract = jaguar.extract(from, to);

extract.on('file', (name) => {
    console.log(name);
});

extract.on('progress', (percent) => {
    console.log(percent + '%');
});

extract.on('error', (error) => {
    console.error(error);
});

extract.on('end', () => {
    console.log('done');
});
```


In case of starting example output should be similar to:

```
33%
67%
100%
done
```

## Related

- [Bizzy](https://github.com/coderaiser/node-bizzy "Bizzy") - Pack and extract .tar.bz2 archives with emitter.
- [Jag](https://github.com/coderaiser/node-jag "Jag") - Pack files and folders with tar and gzip.
- [OneZip](https://github.com/coderaiser/node-onezip "OneZip") - Pack and extract zip archives with emitter.
- [Tar-to-zip](https://github.com/coderaiser/node-tar-to-zip "tar-to-zip") - Convert tar and tar.gz archives to zip.
- [Copymitter](https://github.com/coderaiser/node-copymitter "Copymitter") - Copy files with emitter.
- [Remy](https://github.com/coderaiser/node-remy "Remy") - Remove files with emitter.

## License

MIT

[NPMIMGURL]:                https://img.shields.io/npm/v/jaguar.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/node-jaguar/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/david/coderaiser/node-jaguar.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]:                   https://npmjs.org/package/jaguar "npm"
[BuildStatusURL]:           https://travis-ci.org/coderaiser/node-jaguar  "Build Status"
[DependencyStatusURL]:      https://david-dm.org/coderaiser/node-jaguar "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[CoverageURL]:              https://coveralls.io/github/coderaiser/node-jaguar?branch=master
[CoverageIMGURL]:           https://coveralls.io/repos/coderaiser/node-jaguar/badge.svg?branch=master&service=github

