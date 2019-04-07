$(document).ready(function()
{
    const R = 6371000
    var map = L.map('map').setView([45.4626, 9.2013], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.zoomControl.setPosition('bottomleft');

    /*
    function onLocationFound(e) {
        var radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    }
    map.on('locationfound', onLocationFound);

    function onLocationError(e) {
        console.log(e.message);
    }

    map.on('locationerror', onLocationError);

    map.locate({setView: true, maxZoom: 16});
    */

    polyline = L.polyline([]).addTo(map);
    var points = [];
    function showpoly(){
        var lat = document.getElementById('lat').value;
        var lng = document.getElementById('lng').value;
        console.log(lat);
        console.log(lng);
        polyline.addLatLng(L.latLng(parseFloat(lat),parseFloat(lng)));
        points.push([lat,lng]);
        if (points.length > 1) {
            map.fitBounds(polyline.getBounds());
        }
    }
    function distance(lat1,lon1,lat2,lon2) {
        var dLat = deg2rad(lat2-lat1); 
        var dLon = deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c / 1000; // Distance in km
        return d;
      }
      
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }
    function start(){
        var speed = parseFloat(document.getElementById('speed').value);
        console.log(speed);
        var dist = distance(points[0][0], points[0][1], points[1][0], points[1][1]);
        console.log(dist);
        var time = (dist / speed)*60*60*1000
        console.log(time);
        var marker = L.Marker.movingMarker(polyline.getLatLngs(),
            [time]).addTo(map);
        marker.start();
    }
    map.addLayer(polyline);

    var boundingBoxMilanCoords = [
        [45.3743, 9.0519],
        [45.3743, 9.3507],
        [45.5509, 9.3507],
        [45.5509, 9.0519],
        [45.3743, 9.0519]
    ];            

    var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
    
    $("#button").click(showpoly);
    $("#button_speed").click(start);
})