var map = L.map('map').setView([45.4626, 9.2013], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');


var boundingBoxMilanCoords = [
    [45.535946, 9.040613],
    [45.535946, 9.277997],
    [45.386724, 9.277997],
    [45.386724, 9.040613],
    [45.535946, 9.040613]
];

var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
var zones;
var features;

var slidersGenerator = function(features) {
    ret = '';
    var zonename = ''
    var zoneindex = 0;
    for (i in features) {
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
}

$.getJSON('https://www.leafroute.tk/zone.min.json', function(data) {
    zones = L.geoJson(data).addTo(map);
    features = data['features'];
    $("#sliders").html(slidersGenerator(features));
    try {
        addEventListeners();
        equalize($("#sliders"));
    }
    catch(err) {
        console.log("autosliders.js seems to be missing")
    }
});
var markers = []

var endpoint = 'http://localhost:1337/getroutes';
$('#endpoint').val(endpoint);
var updateEndpoint = function() {
    endpoint = $('#endpoint').val();
    console.log('Endpoint set to '+endpoint);
}

var generateRoutePoints = function() {
    var totalMarkers = $('#totalmarkers').val();
    var routePoints = [];
    var relatedSrcPercentage = [];
    var relatedDestPercentage = [];
    //Create percentage using sliders for startpoints and uniform percentage for endpoints
    for (var i = 0; i < zones.getLayers().length; i++) {
        relatedSrcPercentage.push($('#opt-src'+i).val() / 10.0);
        relatedDestPercentage.push($('#opt-dest'+i).val() / 10.0);
    }    
    let startPoints = generateNPointsinLeafletLayer(totalMarkers, relatedSrcPercentage);
    let endPoints = generateNPointsinLeafletLayer(totalMarkers, relatedDestPercentage);
    for (var j = 0; j < endPoints.length; j++) {
        routePoints.push([startPoints[j],endPoints[j]]);
    }
    return routePoints;
}

function waitForReady(marker) {
  return new Promise(resolve => {
    function checkReady() {
      if (marker.ready == true) {
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


var startSimulation = async function() {
    markers.forEach(async function(marker) {
        await waitForReady(marker);
        marker._stop();
    });
    markers = [];
    console.log('starting simulation');
    var speed = parseFloat($('#speed').val());
    var timer = parseFloat($('#timer').val());
    //speed or timer may be ""
    if (isNaN(speed)) speed = 1;
    if (isNaN(timer)) timer = 5000;
    var routePoints = generateRoutePoints();
    for (i = 0; i < routePoints.length; i++) {
        let marker = new L.Marker.MovingMarker.ARLibMarker(routePoints[i][0], routePoints[i][1], true, speed, timer, null, endpoint);
        if (timer != 0) {
            let random = Math.random()*200
            await sleep(random)
            marker.addTo(map)
        }
        markers.push(marker);
    }
    if (timer == 0){
        for (i = 0; i < markers.length; i++) {
            await waitForReady(markers[i]);
        }
        markers.forEach(function(marker) {
            marker.addTo(map);
        });
    }
}

$('#start-sim').click(startSimulation);

var generatePointInsidePolygon = function(bboxArray, polygonGeoJSON){
    while (true) {
        var pointCoords = turf.randomPoint(1, {bbox: bboxArray}).features[0].geometry.coordinates;
        if (turf.booleanPointInPolygon(pointCoords, polygonGeoJSON)) {
            return pointCoords;
            //return a coordinate in [lon, lat] format
        } else {
            return null;
        }
    }
}

var randomPointInLeafletPolygon = function(layer) {
    var bounds = layer.getBounds().toBBoxString().split(',').map(Number);
    var point = generatePointInsidePolygon(bounds, layer.toGeoJSON());
    if (point != null)
        return point.reverse();
    else
        return null;
}

var randomLayer = function(distribution) {
    let point = Math.random()*(distribution[distribution.length-1]);
    for (x in distribution) {
        if (point <= distribution[x]) 
            return zones.getLayers()[x];
    }
}

var generateNPointsinLeafletLayer = function(number, percentage) {
    var points = [];
    var i = 0;
    //Create distribution using given percentages
    var distribution = [];
    for (let x = 1; x <= percentage.length; x++) {
        let sum = percentage
        .slice(0,x) 
        .reduce((a,b) => a + b);
        distribution.push(sum);
    }
    while (i < number) {
        layer = randomLayer(distribution);
        var point = randomPointInLeafletPolygon(layer);
        while (point == null) {
            point = randomPointInLeafletPolygon(layer);
        }
        points.push(point);
        i++;
    }
    return points;
}