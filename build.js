//build.js - builds isochrones for files in files array
const fs = require('fs');
const reader = require('geojson-writer').reader
const turf = require("@turf/turf");
const Axios = require('axios');

const files = ['LRT.json'];

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
          dir: 'lts4'
        };

const result = turf.featureCollection([]);
let places = reader('data_in/'+files[0])
console.log("Processing file: ", files[0]);

const promises = places.features.map(async place => {

  const name = place.properties.name;
  console.log("Place: ", name);
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
   console.log('response:',response.data);
   result.features = result.features.concat(response.data.features);


});

//const results = await Promise.all(promises)
Promise.all(promises).then(values=>{

  fs.writeFileSync('data_out/'+files[0], JSON.stringify(result, null, 4));
});
