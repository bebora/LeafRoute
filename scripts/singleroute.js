var map = L.map('map').setView([45.46133, 9.15930], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// create the sidebar instance and add it to the map
var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');
let routeColors = [
    {'innerColor': '#0090ff', 'outerColor': '#0050b9'},
    {'innerColor': '#999', 'outerColor': '#444'}
];

let boundingBoxMilanCoords = [
    [45.535946, 9.040613],
    [45.535946, 9.277997],
    [45.386724, 9.277997],
    [45.386724, 9.040613],
    [45.535946, 9.040613]
];

let boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
let markers = [];
//TODO find a way to remove this code duplication, passing a input form reference when selecting the place from suggested ones
let sourceMarker;
let destinationMarker;
let sourcePlace;
let destinationPlace;
function setSource(event, selected) {
    $('#follow').css('display', 'none');
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
        lat = selected.geometry.coordinates[1];
        lng = selected.geometry.coordinates[0];
    }
    sourceMarker = L.marker([
        lat,
        lng
    ]).addTo(map);
    sourcePlace = [lat, lng];
}
function setDestination(event, selected) {
    $('#follow').css('display', 'none');
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
        lat = selected.geometry.coordinates[1];
        lng = selected.geometry.coordinates[0];
    }
    destinationMarker = L.marker([
        lat,
        lng
    ]).addTo(map);
    destinationPlace = [lat, lng];
}


let engine = new PhotonAddressEngine({'lang': 'it'});
engine.bindDefaultTypeaheadEvent($('#address-src'));
$(engine).bind('addresspicker:selected', setSource);
$('#address-src').typeahead(null, {
    source: engine.ttAdapter(),
    displayKey: 'description'
});

let endpoint = 'http://localhost:1337/getroutes';
$('#endpoint').val(endpoint);
var updateEndpoint = function() {
    endpoint = $('#endpoint').val();
    console.log('Endpoint set to '+endpoint);
}

let engine1 = new PhotonAddressEngine({'lang': 'it'});
engine1.bindDefaultTypeaheadEvent($('#address-dest'));
$(engine1).bind('addresspicker:selected', setDestination);
$('#address-dest').typeahead(null, {
    source: engine1.ttAdapter(),
    displayKey: 'description'
});

let possibleRoutes = [];
let possibleRoutesPolyline = [];
let selectedRoute = null;
let selectedRoutePolyline = null;
let clickPosition = 0;

map.on('click', function(e){
    $.getJSON('https://nominatim.openstreetmap.org/reverse?', {
        lat : e.latlng.lat,
        lon : e.latlng.lng,
        format : 'json'} )
        .done(function( json ) {
            console.log(json);
            let addressSrc= $('#address-src').val();
            if (clickPosition == 1) {
                clickPosition = 0;
                $('#address-dest').val(json.display_name);
                setDestination(null, [e.latlng.lat, e.latlng.lng])
            }
            else if (clickPosition == 0) {
                clickPosition = 1;
                $('#address-src').val(json.display_name);
                setSource(null, [e.latlng.lat, e.latlng.lng])
            }
    });
});

var choosePolyLine = function(selectedId) {
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
};


var onSelectRoute = function(e){
    $('#follow').css('display', 'none');
    $('#options-panel').html('');
    let selectedId;
    try {
        selectedId = this.options.groupId;
        // Route on map has been clicked
        L.DomEvent.stopPropagation(e);
    }
    catch (exception) {
        // Info panel has been clicked
        selectedId = e.attributes.routeindex.value;
    }
    let associatedPath = possibleRoutes[selectedId];
    choosePolyLine(selectedId);
    possibleRoutes = [];
    possibleRoutesPolyline = [];
    let speed = parseFloat($('#speed').val());
    let timer = parseFloat($('#timer').val());
    //speed or timer may be ""
    if (isNaN(speed)) speed = 1;
    if (isNaN(timer)) timer = 12000;
    //this.options.originalResponse
    let marker = new L.Marker.MovingMarker.ARLibMarker(
        associatedPath,
        null,
        true,
        speed,
        timer,
        polyline,
        endpoint);
    markers.push(marker);
    marker.addTo(map);
};


var current_position = null;
$('#follow').click(function(e){
    setInterval(locate, 3000);
});

function locate() {
    map.locate(map.locate({setView: true, maxZoom: 16}));
}
map.on('locationfound', onLocationFound);

function onLocationFound(e) {
    if (current_position == null) {
        current_position = L.marker(e.latlng).addTo(map);
    }else {
        current_position.setLatLng(e.latlng);
    }
    choosePolyLine(0);
    $('#options-panel').html('');
    let fg = L.featureGroup([current_position, selectedRoutePolyline]).addTo(map);
    map.fitBounds(fg.getBounds());
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

let timeToString = function(totalTime) {
    let timeToDisplay;
    if (totalTime < 60) {
        timeToDisplay = Math.floor(totalTime)+' seconds';
    }
    else if (totalTime < 3600) {
        timeToDisplay = Math.floor(totalTime/60)+' min';
    }
    else {
        timeToDisplay = Math.floor(totalTime/3600) + ' h '+ Math.floor((totalTime % 3600)/60)+' min';
    }
    return timeToDisplay
};

let addRouteInfoPanel = function(path, index) {
    let totalTime = 0;
    for (let j in path) {
        totalTime += path[j][2];
    }
    let timeToDisplay = timeToString(totalTime);
    let childDiv = '<div class="flex-container-info ';
    if(index === 0) childDiv += 'main-option';
    else childDiv += 'secondary-option';
    childDiv +='" routeindex="'+index+'" onclick="onSelectRoute(this)">' +
        '<p style="margin-top: 15px">' + (index === 0 ? 'Best route' : 'Alternative route #'+index) + '</p>' +
        '<p style="margin-top: 15px">Estimated time: ' + timeToDisplay +
        '</p></div>';
    $('#options-panel').prepend(childDiv);
};

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
    $('#follow').css('display', 'inline-block');
    $('#options-panel').html('');
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
                path = json[i];
                fancyPolyline = strokePolyline(
                    path,
                    {
                        ...routeColors[i===0 ? 0 : 1],
                        groupId: i,
                        onClick: onSelectRoute
                    });
                possibleRoutesPolyline.push(fancyPolyline);
                fancyPolyline.addTo(map);
                addRouteInfoPanel(path, i);
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
});
