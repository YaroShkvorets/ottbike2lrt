//build.js - builds isochrones for files in files array
const fs = require('fs');
const reader = require('geojson-writer').reader
const turf = require("@turf/turf");
const Axios = require('axios');

const files = ['Confederation Line phase 1'];

const params = {
          lng: 0,
          lat: 0,
          radius: 3,
          deintersect: 'true',
          concavity: 2,
          lengthThreshold: 0,
          units: 'kilometers',
          intervals: [3, 6, 9],
          cellSize: 0.2,
          dir: ''
        };

let places = reader(`data_in/${files[0]}.json`)
console.log(`*** Processing file: ${files[0]}.json ***`);

['lts2','lts3','lts4'].map(lts => {
  const result = turf.featureCollection([]);
  params.dir = lts

  const promises = places.features.map(async place => {

    console.log(`Processing ${place.properties.name} at LTS ${lts}`);
    params.lng = place.geometry.coordinates[0]
    params.lat = place.geometry.coordinates[1]

    let url = 'https://maps.bikeottawa.ca:3000/?';
    Object.keys(params).forEach(key => url+=key+'='+params[key]+'&');
    Object.keys(params.intervals).forEach(i => url+='intervals='+params.intervals[i]+'&');

    const response = await Axios({
       method: 'GET',
       url: url,
       json: true,
       headers: {
         Accept: 'application/vnd.github.v3+json',
         'User-Agent': 'Axios'
       }
     })
     result.features = result.features.concat(response.data.features);
  });

  Promise.all(promises).then(()=>{

    fs.writeFileSync(`data_out/${files[0]}-${lts}.json`, JSON.stringify(result, null, 2));
  });
});
