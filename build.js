//build.js - builds isochrones for files in files array
const fs = require('fs')
const reader = require('geojson-writer').reader
const turf = require("@turf/turf")
const Axios = require('axios')

const files = ['Confederation Line phase 1']

const params = {
          lng: 0,
          lat: 0,
          radius: 3,
          deintersect: 'true',
          concavity: 2,
          lengthThreshold: 0,
          units: 'kilometers',
          intervals: [3, 6, 9, 12, 15],
          cellSize: 0.2,
          dir: ''
        }
const levels = ['lts1','lts2','lts3','lts4']

files.forEach(filename => {
  console.log(`*** Processing file: ${filename}.json ***`);
  let places = reader(`data_in/${filename}.json`)

  const result = turf.featureCollection([]);
  levels.forEach(lts => {
    params.dir = lts

    const promises = places.features.map(async ({properties, geometry}) => {

      console.log(`Processing ${properties.name} at LTS ${lts}`);
      params.lng = geometry.coordinates[0]
      params.lat = geometry.coordinates[1]

      let url = 'https://maps.bikeottawa.ca:3000/?';
      Object.keys(params).forEach(key => url+=`${key}=${params[key]}&`);
      Object.keys(params.intervals).forEach(i => url+=`intervals=${params.intervals[i]}&`);

      const response = await Axios({
         url: url,
         headers: {'User-Agent': 'Axios'}
       })
       if(response.data.error || response.data.features.length==0) {return;}
       response.data.features.forEach(f => f.properties['name'] = properties.name)
       response.data.features.forEach(f => f.properties['lts'] = lts)
       result.features = result.features.concat(response.data.features);
    });

    Promise.all(promises).then(()=>{

      fs.writeFileSync(`data_out/${filename}-lts.json`, JSON.stringify(result, null, 2));
    });
  });
});
