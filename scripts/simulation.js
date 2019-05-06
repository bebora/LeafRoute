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
$.getJSON("https://www.leafroute.tk/zone.min.json", function(data) {
    zones = L.geoJson(data).addTo(map);
    features = data['features'];
});
var markers = []


var generateRoutePoints = function() {
    var totalMarkers = $("#totalmarkers").val();
    var routePoints = [];
    for (var i = 1; i <= zones.getLayers().length; i++) {
        let relatedPercentage = $("#opt"+i).val() / 1000.0;
        let relatedMarkers = Math.floor(relatedPercentage * totalMarkers);
        let startPoints = generateNPointsinLeafletLayer(relatedMarkers, zones.getLayers()[i-1]);
        let endPoints = []
        for (var j = 1; j <= zones.getLayers().length; j++) {
            let subRelatedPercentage = 1 / zones.getLayers().length;
            let subRelatedMarkers = Math.floor(subRelatedPercentage * relatedMarkers);
            let tempEndPoints = generateNPointsinLeafletLayer(subRelatedMarkers, zones.getLayers()[j-1]);
            endPoints.push.apply(endPoints, tempEndPoints);
        }
        
        let tempRoutePoints = []
        for (var j = 0; j < endPoints.length; j++) {
            tempRoutePoints.push([startPoints[j],endPoints[j]]);
        }

        routePoints.push.apply(routePoints, tempRoutePoints);
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
        marker.stop();
    });
    markers = [];
    console.log("starting simulation");
    var speed = $("#speed").val();
    var timer = $("#timer").val();
    var routePoints = generateRoutePoints();
    for (i = 0; i < routePoints.length; i++) {
        let marker = new L.Marker.MovingMarker.ARLibMarker(routePoints[i][0], routePoints[i][1], false, speed, timer);
        markers.push(marker);
    }
    for (i = 0; i < markers.length; i++) {
        await waitForReady(markers[i]);
    }
    markers.forEach(function(marker) {
        marker.addTo(map);
    });
}

$("#start-sim").click(startSimulation);

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

var generateNPointsinLeafletLayer = function(number, layer) {
    var points = [];
    var i = number;
    while (i > 0) {
        var point = randomPointInLeafletPolygon(layer);
        if (point != null) {
            i--;
            points.push(point);
        }
    }
    return points;
}