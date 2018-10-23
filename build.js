//build.js - builds isochrones for files in files array
const fs = require('fs')
const reader = require('geojson-writer').reader
const turf = require("@turf/turf")
const Axios = require('axios')
const Semaphore = require('await-semaphore').Semaphore

const files = ['OttLRTphase1']

const params = {
          lng: 0,
          lat: 0,
          radius: 4,
          deintersect: 'false',
          concavity: 2,
          lengthThreshold: 0,
          units: 'kilometers',
          intervals: [3,6,9,12,15],
          cellSize: 0.1,
          dir: ''
        }
const levels = ['lts1','lts2','lts3','lts4']
const semaphore = new Semaphore(1)  //5 requests at a time

files.forEach(filename => {
  console.log(`*** Processing file: ${filename}.json ***`);
  let places = reader(`data_in/${filename}.json`)

  const result = turf.featureCollection([]);
  levels.forEach(lts => {
    params.dir = lts

    const promises = places.features.map(async place => {

      result.features.push(place)
      params.lng = place.geometry.coordinates[0]
      params.lat = place.geometry.coordinates[1]

      let url = 'https://maps.bikeottawa.ca:3000/?';
      Object.keys(params).forEach(key => url+=`${key}=${params[key]}&`);
      Object.keys(params.intervals).forEach(i => url+=`intervals=${params.intervals[i]}&`);

      const release = await semaphore.acquire();
      console.log(`Processing ${place.properties.name} at LTS ${lts}`);
      let failed = false
      const response = await Axios({
         url: url,
         headers: {'User-Agent': 'Axios'}
       })
       .catch(error =>{ console.log(`Axios errored for ${place.properties.name} on url: ${url}. ${error}`); failed=true});
       release();
       if(failed || response.data.error || response.data.features.length==0) {return;}
       response.data.features.forEach(f => {
         if(f!=null) {
           f.properties = {name:place.properties.name, lts:lts, time:f.properties.time}
         }
       })
       result.features = result.features.concat(response.data.features.filter(f => f && f.geometry.type=='Polygon'));
    });

    Promise.all(promises).then(()=>{

      fs.writeFileSync(`data_out/${filename}-lts.json`, JSON.stringify(result, null, 2));
    });
  });
});
