  const url = require('url');
const OSRM = require('osrm');
const isochrone = require('./isochrone');
const parseQuery = require('./utils');
const log4js = require('log4js');

log4js.configure({
  appenders: { isochrones: { type: 'file', filename: 'maps.log' } },
  categories: { default: { appenders: ['isochrones'], level: 'info' } }
});

const logger = log4js.getLogger('isochrones');

/**
 * Isochrone server
 *
 * @name galton (slightly modified)
 * @param {serverConfig} config default isochrone options
 */
const galton = (config) => {
  logger.info("Starting Galton server ...")
  let osrmServers = {}
  for(let path of config.osrmPaths){
    const dir = path.split('/')[1]
      osrmServers[dir] = new OSRM({
      path: path,
      shared_memory: config.sharedMemory
    })
  }

  return (req, res) => {
    logger.info("Request: "+'https://maps.bikeottawa.ca:3000'+req.url)
    const { query } = url.parse(req.url, true);
    const osrm = osrmServers[query.dir]
    const options = Object.assign({}, parseQuery(query),{osrm});

    if (config.cors) {
     res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (typeof options.lng != 'undefined')
    {
      isochrone([options.lng, options.lat], options)
        .then(geojson => res.end(JSON.stringify(geojson)))
        .catch((error) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error }));
        });
    }
  };
};

module.exports = galton;
