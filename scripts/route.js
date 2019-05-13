$(document).ready(function()
{
    var map = L.map('map').setView([45.4626, 9.2013], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    map.zoomControl.setPosition('bottomleft');

    var start_lat;
    var start_lng;
    var end_lat;
    var end_lng;
    polyline = L.polyline([]).addTo(map);
    var paths = [];
    var animations = []
    var route_colors = [
        'rgb(255,0,0)',
        'rgb(127,93,93)',
        'rgb(63,51,51)',
        'rgb(31,25,25)'
    ]
    function showroute(){
        //delete previous routes and markers
        while(paths.length != 0) {
            map.removeLayer(paths.pop());
        }
        while(animations.length != 0) {
            map.removeLayer(animations.pop());
        }
        start_lat = $('#lat-start').val();
        start_lng = $('#lng-start').val();
        end_lat = $('#lat-end').val();
        end_lng = $('#lng-end').val();
        endpoint = 'http://localhost:1337/getroutes?';
        $.getJSON( endpoint, { s_lat: start_lat, s_lon: start_lng, e_lat: end_lat, e_lon: end_lng, reroute: 'false' } )
        .done(function( json ) {
            for (alternative_index in json) {
                color = route_colors[alternative_index];
                polypath = L.polyline(json[alternative_index], {color:color, weight:6-alternative_index*1.5});
                polypath.addTo(map);
                paths.push(polypath);
            }
            if (paths.length > 0) {
                //Zoom to received paths
                viewBox = L.latLngBounds();
                for (i=0; i< paths.length; i++){
                    viewBox.extend(paths[i].getBounds());
                }
                //Slightly extend box
                map.fitBounds(viewBox.pad(0.10));
            }
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ', ' + error;
            console.log( 'Request Failed: ' + err );
        });
        
    }

    function animate_routes(){
        var speed = $('#speed').val();
        if (speed == '') {
            speed = 50;
            $('#speed').val('50');
        }
        console.log('Speed is '+speed+' km/h');
        for (i=0; i < paths.length; i++) {
            polypath = paths[i];
            total_lenght = 0;
            components = polypath.getLatLngs();
            if (components.length >= 2) {
                for (j=0; j < components.length-1; j++) {
                    total_lenght += components[j].distanceTo(components[j+1]);
                }
            }
            time_seconds = (total_lenght / (speed / 3.6));
            marker = L.Marker.movingMarker(components,time_seconds*1000).addTo(map);
            marker.start();
            animations.push(marker);
        }
    }

    var boundingBoxMilanCoords = [
        [45.535946, 9.040613],
        [45.535946, 9.277997],
        [45.386724, 9.277997],
        [45.386724, 9.040613],
        [45.535946, 9.040613]
    ];

    var boundingBoxMilan = L.polyline(boundingBoxMilanCoords).addTo(map);
    $.getJSON('https://www.leafroute.tk/zone.json', function(data) {
        L.geoJson(data).addTo(map);
    });
    
    $('#button').click(showroute);
    $('#button-speed').click(animate_routes);
    var points_added = [];
    map.on('click', function(e){
        console.log(paths.length);
        if (points_added.length == 0) {
            start = new L.Marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            points_added.push(start);
            $('#lat-start').val(e.latlng.lat);
            $('#lng-start').val(e.latlng.lng);
        }
        else if (points_added.length == 1) {
            end = new L.Marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            points_added.push(end);
            $('#lat-end').val(e.latlng.lat);
            $('#lng-end').val(e.latlng.lng);
        }
        else {
            while(points_added.length != 0) {
                to_rm = points_added.pop();
                map.removeLayer(to_rm);
            }
            $('#lat-start').val('');
            $('#lng-start').val('');
            $('#lat-start').val('');
            $('#lng-start').val('');
        }
 });
})
