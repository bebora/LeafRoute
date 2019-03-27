$(document).ready(function()
{
    var map = L.map('map').setView([45.465756, 9.187551], 14);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    }
    //TODO remove location if useless
    map.on('locationfound', onLocationFound);

    function onLocationError(e) {
        console.log(e.message);
    }

    map.on('locationerror', onLocationError);

    map.locate({setView: true, maxZoom: 16});

    polyline = L.polyline([]).addTo(map);
    var size = 0;
    function showpoly(){
        var lat = document.getElementById('lat').value;
        var lng = document.getElementById('lng').value;
        console.log(lat);
        console.log(lng);
        polyline.addLatLng(L.latLng(parseInt(lat,10),parseInt(lng,10)));
        size = size + 1;
        if (size > 1) {
            map.fitBounds(polyline.getBounds());
        }
    }
    map.addLayer(polyline);
    document.getElementById("button").addEventListener("click", showpoly);
})