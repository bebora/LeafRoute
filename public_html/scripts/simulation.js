var map = L.map('map').setView([45.46133, 9.15930], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');
let uploadedCsv = null;
let relatedSrc = [];
var boundingBoxMilanCoords = [
    [45.535946, 9.040613],
    [45.535946, 9.277997],
    [45.386724, 9.277997],
    [45.386724, 9.040613],
    [45.535946, 9.040613]
];
let defaultmaps = ['data/zones.min.json', 'data/nil.min.json', null];
var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
var features;


function handleFiles(files, string) {
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
        if (string === 'csv')
            getAsFiles(files[0], loadCsv);
        else {
            $('#geojsonfilelabel').html(files[0].name);
            getAsFiles(files[0], loadJson);
        }
    } else {
        alert('FileReader are not supported in this browser.');
    }
  }

  function getAsFiles(fileToRead, funct) {
    var reader = new FileReader();
    // Read file into memory as UTF-8
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = funct;
    reader.onerror = errorHandler;
  }

  function loadJson(event) {
    defaultmaps[2] = JSON.parse(event.target.result);
  }

  function loadCsv(event) {
    var csv = event.target.result;
    let allTextLines = csv.split(/\r\n|\n/);
    let lines = [];
    for (var i=0; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data[0] !== "") {
            var tarr = [];
            for (var j=0; j<data.length; j++) {
                tarr.push(parseFloat(data[j]));
            }
            lines.push(tarr);
        }
    }
    let total = 0;
    for (let i = 0; i < lines.length; i++) {
        let temp = 0;
        if (lines[i].length !== lines.length) {
            alert("CSV is not a regular matrix!");
            return;
        }
        for (let j = 0; j < lines[i].length; j++) {
            temp += lines[i][j];
            total += lines[i][j];
        }
        relatedSrc.push(temp);
    }
    if (Math.abs(total - 1) > 0.01) {
        alert("The sum of all values should be 1!");
        return;
    }
    uploadedCsv = lines;
  }

  function errorHandler(evt) {
    if(evt.target.error.name === "NotReadableError") {
        alert("Cannot read file !");
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
    let selectedIndex = parseInt($("#selectedGeoJson").val());
    if (selectedIndex !== currentGeoJSONIndex || selectedIndex === 2) {
        if (currentGeoJSONOnMap != null)
            map.removeLayer(currentGeoJSONOnMap);
        currentGeoJSONIndex = selectedIndex;
        if (selectedIndex !== 2) {
            $.ajax({
            dataType: 'json',
            url: defaultmaps[selectedIndex],
            mimeType: 'application/json',
            success: applyGeoJson
        });
        }
        else if (defaultmaps[selectedIndex] != null) {
            applyGeoJson(defaultmaps[2]);
        }
        else{
            alert("Insert GeoJson file first!");
        }
    }
};

var applyGeoJson = function (data) {
    currentGeoJSONOnMap = L.geoJson(data).addTo(map);
    map.fitBounds(currentGeoJSONOnMap.getBounds())
    features = data['features'];
    $("#sliders").html(slidersGenerator(features));
    try {
        addEventListeners();
        equalize($('#sliders'));
    }
    catch(err) {
        console.log('autosliders.js seems to be missing');
    }
};


updateGeoJSON();



var endpoint = 'http://localhost:1337/getroutes';
$('#endpoint').val(endpoint);
var updateEndpoint = function() {
    endpoint = $('#endpoint').val();
    console.log('Endpoint set to '+endpoint);
};

var generateCsvRoutePoints = function() {
    if (uploadedCsv == null || uploadedCsv.length !== currentGeoJSONOnMap.getLayers().length) {
        alert("Upload a correct CSV first!");
    }
    else {
        let totalMarkers = $('#totalmarkers').val();
        let routePoints = generateSourceDestinationPoints(totalMarkers);
        startSimulation(routePoints);
    }
};


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
    let srcDistribution = distributionFromPercentage(relatedSrcPercentage);
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
};

var stats = {
    times: [],
    errors: []
};

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
        let marker = new L.Marker.MovingMarker.ARLibMarker(routePoints[i][0], routePoints[i][1], true, speed, timer, null, endpoint, stats);
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
            return [currentGeoJSONOnMap.getLayers()[x], x];
    }

};

var generateNPointsinLeafletLayer = function(number, distribution) {
    let points = [];
    let i = 0;
    //Create distribution using given percentages
    while (i < number) {
        let layer = randomLayer(distribution)[0];
        let point = randomPointInLeafletPolygon(layer);
        points.push(point);
        i++;
    }
    return points;
};

var normalize = function(percentage) {
    let normalized = [];
    let total = percentage.reduce((a, b) => a + b, 0);
    for (let x = 0; x < percentage.length; x++) {
        normalized.push(percentage[x]/total * 100);
    }
    return normalized;
};

var distributionFromPercentage = function(percentage) {
    let distribution = [];
    for (let x = 1; x <= percentage.length; x++) {
        let total = percentage
        .slice(0,x)
        .reduce((a,b) => a + b);
        distribution.push(total);
    }
    return distribution;
};

var generateSourceDestinationPoints = function(number) {
    let points = [];
    let i = 0;
    //Create distribution using given percentage
    var sourceDistribution = distributionFromPercentage(relatedSrc);
    var destionationsDistribution = uploadedCsv.map(normalize).map(distributionFromPercentage);
    while (i < number) {
        let layer = randomLayer(sourceDistribution);
        let sourcePoint = randomPointInLeafletPolygon(layer[0]);
        let destDistribution = destionationsDistribution[layer[1]];
        layer = randomLayer(destDistribution)[0];
        let destinationPoint = randomPointInLeafletPolygon(layer);
        points.push([sourcePoint,destinationPoint]);
        i++;
    }
    return points;

};


$('#dumpStats').click(dumpStats);

