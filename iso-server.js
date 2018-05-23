#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const galton = require('./galton');
const defaults = require('./galton/defaults.js');

const config = {
    radius: defaults.radius,
    cellSize: defaults.cellSize,
    concavity: defaults.concavity,
    cors: true,
    deintersect: 'true',
    intervals: '3 6 9 12 15',
    lengthThreshold: defaults.lengthThreshold,
    port: 4000,
    sharedMemory: false,
    units: defaults.units
  }
  config.osrmPaths = ['data/lts1/data.osrm', 'data/lts2/data.osrm', 'data/lts3/data.osrm', 'data/lts4/data.osrm']

let path
try {
    for(path of config.osrmPaths){
      fs.accessSync(path, fs.F_OK);
    }
} catch (error) {
  process.stderr.write('File not found: '+path+ ` ${error}\n`);
  process.exit(-1);
}

try {
  config.intervals = config.intervals
    .split(' ')
    .map(parseFloat)
    .sort((a, b) => a - b);
} catch (error) {
  process.stderr.write('Bad intervals: '+config.intervals+` ${error}\n`);
  process.exit(-1);
}

config.radius = parseFloat(config.radius);
config.cellSize = parseFloat(config.cellSize);
config.concavity = parseFloat(config.concavity);
config.deintersect = config.deintersect === 'true';
config.lengthThreshold = parseFloat(config.lengthThreshold);

const app = galton(config);
const handler = config.socket || config.port;

const server = http.createServer(app);
server.listen(handler, () => {
  if (config.socket) {
    fs.chmodSync(config.socket, '1766');
    process.stdout.write(`🚀  ON AIR @ ${config.socket}\n`);
  } else {
    const address = server.address();
    process.stdout.write(`🚀  ON AIR @ ${address.address}:${address.port}\n`);
  }
});

const shutdown = (signal) => {
  process.stdout.write(`Caught ${signal}, terminating\n`);
  server.close();
  process.exit();
};

process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));
