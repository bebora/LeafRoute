var map = L.map('map').setView([45.4626, 9.2013], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');
var routeColors = [
    {'innerColor': '#0090ff', 'outerColor': '#0050b9'},
    {'innerColor': '#999', 'outerColor': '#444'}
];

var boundingBoxMilanCoords = [
    [45.535946, 9.040613],
    [45.535946, 9.277997],
    [45.386724, 9.277997],
    [45.386724, 9.040613],
    [45.535946, 9.040613]
];

var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
var points_added = [];
var markers = [];
//TODO find a way to remove this code duplication, passing a input form reference when selecting the place from suggested ones
var sourceMarker;
var destinationMarker;
var sourcePlace;
var destinationPlace;
function setSource(event, selected) {
    $('#start').css('display', 'none');
    if (sourceMarker != null)
        map.removeLayer(sourceMarker);
    sourceMarker = null;
    let lat;
    let lng;
    if (Array.isArray(selected)) {
        lat = selected[0];
        lng = selected[1];
    }
    else {
        lat = selected.geometry.coordinates[1],
        lng = selected.geometry.coordinates[0]
    }
    sourceMarker = L.marker([
        lat,
        lng
    ]).addTo(map);
    sourcePlace = [lat, lng];
}
function setDestination(event, selected) {
    $('#start').css('display', 'none');
    if (destinationMarker != null)
        map.removeLayer(destinationMarker);
    destinationMarker = null;
    let lat;
    let lng;
    if (Array.isArray(selected)) {
        lat = selected[0];
        lng = selected[1];
    }
    else {
        lat = selected.geometry.coordinates[1],
        lng = selected.geometry.coordinates[0]
    }
    destinationMarker = L.marker([
        lat,
        lng
    ]).addTo(map);
    destinationPlace = [lat, lng];
}


var engine = new PhotonAddressEngine({'lang': 'it'});
engine.bindDefaultTypeaheadEvent($('#address-src'));
$(engine).bind('addresspicker:selected', setSource);
$('#address-src').typeahead(null, {
    source: engine.ttAdapter(),
    displayKey: 'description'
});

var endpoint = 'http://localhost:1337/getroutes';
$('#endpoint').val(endpoint);
var updateEndpoint = function() {
    endpoint = $('#endpoint').val();
    console.log('Endpoint set to '+endpoint);
}

var engine1 = new PhotonAddressEngine({'lang': 'it'});
engine1.bindDefaultTypeaheadEvent($('#address-dest'));
$(engine1).bind('addresspicker:selected', setDestination);
$('#address-dest').typeahead(null, {
    source: engine1.ttAdapter(),
    displayKey: 'description'
});

var possibleRoutes = [];
var possibleRoutesPolyline = [];
var selectedRoute = null;
var selectedRoutePolyline = null;
var clickPosition = 0;

map.on('click', function(e){
    $.getJSON('https://nominatim.openstreetmap.org/reverse?', {
        lat : e.latlng.lat,
        lon : e.latlng.lng,
        format : 'json'} )
        .done(function( json ) {
            console.log(json);
            var addressSrc= $('#address-src').val();
            if (clickPosition == 1) {
                clickPosition = 0;
                $('#address-dest').val(json.display_name);
                setDestination(null, [parseFloat(json.lat), parseFloat(json.lon)])
            }
            else if (clickPosition == 0) {
                clickPosition = 1;
                $('#address-src').val(json.display_name);
                setSource(null, [parseFloat(json.lat), parseFloat(json.lon)])
            }
    });
});


var onSelectRoute = function(e){
    L.DomEvent.stopPropagation(e);
    selectedId = this.options.groupId;
    //Remove options polylines and redraw selected
    for (i in possibleRoutesPolyline) {
        map.removeLayer(possibleRoutesPolyline[i]);
    }
    selectedRoute = possibleRoutes[selectedId];
    selectedRoutePolyline = strokePolyline(selectedRoute, routeColors[0]);
    //Remove onClick event from stroke polyline
    for (j in selectedRoutePolyline.getLayers()){
        selectedRoutePolyline.getLayers()[j].off('click');
    }
    selectedRoutePolyline.addTo(map);
    polyline = [];
    for (j in selectedRoutePolyline.getLayers()){
        polyline.push(selectedRoutePolyline.getLayers()[j]);
    }
    possibleRoutes = [];
    possibleRoutesPolyline = [];
    let marker = new L.Marker.MovingMarker.ARLibMarker(
        this.options.originalResponse,
        selectedRoute[selectedRoute-1],
        true,
        1,
        8000,
        polyline,
        endpoint);
    markers.push(marker);
    marker.addTo(map);
}

$('#swap').click(function(e){
    let temp = sourceMarker;
    sourceMarker = destinationMarker;
    destinationMarker = temp;
    temp = sourcePlace;
    sourcePlace = destinationPlace;
    destinationPlace = temp;
    temp = $('#address-src').val();
    $('#address-src').val($('#address-dest').val());
    $('#address-dest').val(temp);
});

$('#search').click(function(e){
    //Reset previous routes
    possibleRoutes = [];
    for (i in possibleRoutesPolyline) {
        map.removeLayer(possibleRoutesPolyline[i]);
    }
    possibleRoutesPolyline = [];
    if (sourcePlace == null || destinationPlace == null){
        console.log('Select both source and destination');
        return;
    }
    $('#start').css('display', 'inline-block');
    
    $.getJSON( endpoint, {
        s_lat: sourcePlace[0],
        s_lon: sourcePlace[1],
        e_lat: destinationPlace[0],
        e_lon: destinationPlace[1],
        n_routes: 3,
        reroute: false} )
        .done(function( json ) {
            possibleRoutes = json;
            console.log('Response lenght: ' + json.length);
            for (let i = json.length-1; i >= 0; i--){
                fancyPolyline = strokePolyline(
                    json[i],
                    {
                        ...routeColors[i==0 ? 0 : 1],
                        groupId: i,
                        onClick: onSelectRoute
                    });
                possibleRoutesPolyline.push(fancyPolyline);
                fancyPolyline.addTo(map);
            }
            if (possibleRoutesPolyline.length > 0) {
                //Zoom to received paths
                viewBox = L.latLngBounds();
                for (i in possibleRoutesPolyline){
                    viewBox.extend(possibleRoutesPolyline[i].getBounds());
                }
                //Slightly extend box
                map.fitBounds(viewBox.pad(0.10));
            }
        }).fail(function(response) {
            alert(response.responseText);
            console.log('Request Failed: ' + response.responseText + ', ' + response.status);
        });
})
