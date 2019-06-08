var map = L.map('map').setView([45.46133, 9.15930], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');
var uploadedCsv = null;
var relatedSrc = [];
var boundingBoxMilanCoords = [
    [45.535946, 9.040613],
    [45.535946, 9.277997],
    [45.386724, 9.277997],
    [45.386724, 9.040613],
    [45.535946, 9.040613]
];

var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
var features;
function handleFiles(files) {
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
        getAsText(files[0]);
    } else {
        alert('FileReader are not supported in this browser.');
    }
  }

  function getAsText(fileToRead) {
    var reader = new FileReader();
    // Read file into memory as UTF-8      
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = loadCsv;
    reader.onerror = errorHandler;
  }

  function loadCsv(event) {
    var csv = event.target.result;
    processCsv(csv);
  }

  
  function processCsv(csv) {
    let allTextLines = csv.split(/\r\n|\n/);
    let lines = [];
    for (var i=0; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(';');
            var tarr = [];
            for (var j=0; j<data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
    }
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
        let temp = 0;
        if (lines[i] != lines.lenght) {
            alert("CSV is not a regular matrix!");
            return;
        }
        for (let j = 0; j < lines[i].length; j++) {
            temp += lines[i][j];
            total += lines[i][j];
        }
        relatedSrc.push(temp);
    }
    if (total != 100) {
        alert("The sum of all values should be 1!");
        return;
    }
    uploadedCsv = lines;    
  }

  function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        alert("Canno't read file !");
    }
  }
var slidersGenerator = function(features) {
    let ret = '';
    let zonename = ''
    let zoneindex = 0;
    for (let i in features) {
        ret += "<li><p class=\"slider-description\">";
        zonename = features[i].properties.name;
        if (zonename === undefined) zonename = 'Zone '+zoneindex;
        ret += zonename;
        ret += '</p><input class="slider-auto-reallocate-input pretty-slider option-source" id="opt-src'+zoneindex+'" type="range" min="0" max="1000" style="background:rgba(0,0,0,0)">';
        ret += '<input class="slider-auto-reallocate-input pretty-slider option-destination" id="opt-dest'+zoneindex+'" type="range" min="0" max="1000" style="background:rgba(0,0,0,0)">';
        ret += '</li>';
        zoneindex++;
    }
    return ret;
};


var markers = [];
var currentGeoJSONIndex;
var currentGeoJSONOnMap;
var updateGeoJSON = function() {
    let defaultmaps = ['data/zones.min.json', 'data/nil.min.json'];
    let selectedIndex = parseInt($("#selectedGeoJson").val());
    if (selectedIndex !== 2) {
        if (selectedIndex !== currentGeoJSONIndex) {
            currentGeoJSONIndex = selectedIndex;
            if (currentGeoJSONOnMap != null)
                map.removeLayer(currentGeoJSONOnMap);
            $.ajax({
                dataType: 'json',
                url: defaultmaps[selectedIndex],
                mimeType: 'application/json',
                success: function(data){
                    currentGeoJSONOnMap = L.geoJson(data).addTo(map);
                    features = data['features'];
                    $("#sliders").html(slidersGenerator(features));
                    try {
                        addEventListeners();
                        equalize($('#sliders'));
                    }
                    catch(err) {
                        console.log('autosliders.js seems to be missing');
                    }
                }
            });
        }
    }
    else {
        //TODO read geojson from file and handle the situation when the file has not been chosen yet
    }
};

updateGeoJSON()

var endpoint = 'http://localhost:1337/getroutes';
$('#endpoint').val(endpoint);
var updateEndpoint = function() {
    endpoint = $('#endpoint').val();
    console.log('Endpoint set to '+endpoint);
};

var generateCsvRoutePoints = function() {
    if (uploadedCsv == null || uploadedCsv.length != currentGeoJSONOnMap.getLayers().length) {
        alert("Upload a correct CSV first!");
    }
    else {
        let totalMarkers = $('#totalmarkers').val();
        let routePoints = generateSourceDestinationPoints(totalMarkers);
        startSimulation(routePoints);        
    }
}


var generateSliderRoutePoints = function() {
    let totalMarkers = $('#totalmarkers').val();
    let routePoints = [];
    let relatedSrcPercentage = [];
    let relatedDestPercentage = [];
    //Create percentage using sliders for startpoints and uniform percentage for endpoints
    for (let i = 0; i < currentGeoJSONOnMap.getLayers().length; i++) {
        relatedSrcPercentage.push($('#opt-src'+i).val() / 10.0);
        relatedDestPercentage.push($('#opt-dest'+i).val() / 10.0);
    }
    let srcDistribution = distributionFromPercentage(relatedDestPercentage);
    let destDistribution = distributionFromPercentage(relatedDestPercentage);    
    let startPoints = generateNPointsinLeafletLayer(totalMarkers, srcDistribution);
    let endPoints = generateNPointsinLeafletLayer(totalMarkers, destDistribution);
    for (let j = 0; j < endPoints.length; j++) {
        routePoints.push([startPoints[j],endPoints[j]]);
    }
    return routePoints;
};


function waitForReady(marker) {
  return new Promise(resolve => {
    function checkReady() {
      if (marker.ready === true) {
        resolve();
      } else {
        window.setTimeout(checkReady, 100); 
      }
    }
    checkReady();
  });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


var startSliderSimulation = async function () {
    let routePoints = generateSliderRoutePoints();
    startSimulation(routePoints);
}

var startSimulation = async function(routePoints) {
    markers.forEach(async function(marker) {
        await waitForReady(marker);
        marker._stop();
    });
    markers = [];
    validate($('.slider-auto-reallocate-input.option-source'), 1000);
    validate($('.slider-auto-reallocate-input.option-destination'), 1000);
    console.log('starting simulation');
    let speed = parseFloat($('#speed').val());
    let timer = parseFloat($('#timer').val());
    //speed or timer may be ""
    if (isNaN(speed)) speed = 1;
    if (isNaN(timer)) timer = 12000;
    for (let i = 0; i < routePoints.length; i++) {
        let marker = new L.Marker.MovingMarker.ARLibMarker(routePoints[i][0], routePoints[i][1], true, speed, timer, null, endpoint);
        if (timer !== 0) {
            let random = Math.random()*200;
            await sleep(random);
            marker.addTo(map);
        }
        markers.push(marker);
    }
    if (timer === 0){
        for (i = 0; i < markers.length; i++) {
            await waitForReady(markers[i]);
        }
        markers.forEach(function(marker) {
            marker.addTo(map);
        });
    }
};

$('#slider-sim').click(startSliderSimulation);
$('#csv-sim').click(generateCsvRoutePoints);

var generatePointInsidePolygon = function(bboxArray, polygonGeoJSON){
    while (true) {
        let pointCoords = turf.randomPoint(1, {bbox: bboxArray}).features[0].geometry.coordinates;
        if (turf.booleanPointInPolygon(pointCoords, polygonGeoJSON)) {
            return pointCoords;
            //return a coordinate in [lon, lat] format
        }
    }
};

var randomPointInLeafletPolygon = function(layer) {
    let bounds = layer.getBounds().toBBoxString().split(',').map(Number);
    let point = generatePointInsidePolygon(bounds, layer.toGeoJSON());
    if (point != null)
        return point.reverse();
    else
        return null;
};

var randomLayer = function(distribution) {
    let point = Math.random()*(distribution[distribution.length-1]);
    for (let x in distribution) {
        if (point <= distribution[x]) 
            return currentGeoJSONOnMap.getLayers()[x];
    }
};

var generateNPointsinLeafletLayer = function(number, distribution) {
    let points = [];
    let i = 0;
    //Create distribution using given percentages
    while (i < number) {
        let layer = randomLayer(distribution);
        let point = randomPointInLeafletPolygon(layer);        
        points.push(point);
        i++;
    }
    return points;
};

var normalize = function(percentage) {
    let normalized = [];
    let total = sum(percentage);
    for (let x = 0; x <= percentage.length; x++) {
        normalized.push(percentage/total * 100);
    }
}
var distributionFromPercentage = function(percentage) {
    let distribution = [];
    for (let x = 1; x <= percentage.length; x++) {
        let sum = percentage
        .slice(0,x) 
        .reduce((a,b) => a + b);
        distribution.push(sum);
    }
    return distribution;
}

var generateSourceDestinationPoints = function(number) {
    let points = [];
    let i = 0;
    //Create distribution using given percentage
    var sourceDistribution = distributionFromPercentage(relatedSrc);
    var destionationsDistribution = destionations.map(normalize(line)).map(distributionFromPercentage(line));
    for (let x = 1; x <= percentage.length; x++) {
        let sum = percentage
        .slice(0,x) 
        .reduce((a,b) => a + b);
        distribution.push(sum);
    }
    while (i < number) {
        let layer = randomLayer(sourceDistribution);
        let sourcePoint = randomPointInLeafletPolygon(layer);
        let destDistribution = destionationsDistribution[layer];
        layer = randomLayer(destDistribution);
        let destinationPoint = randomPointInLeafletPolygon(layer);
        points.push([sourcePoint,destinationPoint]);
        i++;
    }
    return points;

}
