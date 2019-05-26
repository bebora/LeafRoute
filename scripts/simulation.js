var map = L.map('map').setView([45.4626, 9.2013], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');

// be notified when a panel is opened
sidebar.on('content', function (ev) {
    switch (ev.id) {
        case 'autopan':
        sidebar.options.autopan = true;
        break;
        default:
        sidebar.options.autopan = false;
    }
});

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
$.getJSON('https://www.leafroute.tk/zone.min.json', function(data) {
    zones = L.geoJson(data).addTo(map);
    features = data['features'];
});
var markers = []


var generateRoutePoints = function() {
    var totalMarkers = $('#totalmarkers').val();
    var routePoints = [];
    var relatedPercentage = [];
    var uniformPercentage = [];
    //Create percentage using sliders for startpoints and uniform percentage for endpoints
    for (var i = 1; i <= zones.getLayers().length; i++) {
        relatedPercentage.push($('#opt'+i).val() / 10.0);
        uniformPercentage.push(100.0/zones.getLayers().length);
    }    
    let startPoints = generateNPointsinLeafletLayer(totalMarkers, relatedPercentage);
    let endPoints = generateNPointsinLeafletLayer(totalMarkers, uniformPercentage);
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


var startSimulation = async function() {
    markers.forEach(function(marker) {
        marker._stop();
    });
    markers = [];
    console.log('starting simulation');
    var speed = $('#speed').val();
    var timer = $('#timer').val();
    var routePoints = generateRoutePoints();
    for (i = 0; i < routePoints.length; i++) {
        let marker = new L.Marker.MovingMarker.ARLibMarker(routePoints[i][0], routePoints[i][1], markers, false, speed, timer);
        markers.push(marker);
    }
    for (i = 0; i < markers.length; i++) {
        await waitForReady(markers[i]);
    }
    markers.forEach(function(marker) {
        marker.addTo(map);
    });
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