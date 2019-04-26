class ARLibMarker {
    /**
     * Construct an ARLibMarker, a wrapper of a MovingMarker, given the waypoints and set it ready when it's ready to be added to the LeafLet map
     * @param {Array} startPoint array with latitude and longitude of the starting point
     * @param {*} destination array with the latitude and longitude of destination point
     * @param {*} option optional parameters defining the speed, the timing of rerouting and the endpoint used as a routing machine
     */
    constructor(startPoint, destination, {speed =100, timer = 1000, endpoint = 'http://localhost:1337/getroutes?'}) {
        var temp = [startPoint]
        this.speed = speed;
        this.timer = timer;
        this.rerouting = false;
        this.endpoint = endpoint;
        this.reroute = false;
        this.current_index = 1;
        this.ready = false;
        var that = this;
        this.marker;
        $.getJSON( this.endpoint, {s_lat: startPoint[0],s_lon: startPoint[1],e_lat: destination[0],e_lon: destination[1],  reroute: this.reroute} )
        .done(function( json ) {
            var latlngs = json[0];
            that.marker = new L.Marker.MovingMarker([latlngs[0]], 0);
            that.destination = latlngs[latlngs.length-1];
            if (latlngs.length >= 4) {
                that.QueueLatlngs = latlngs.slice(3);
                that.currentLatlngs = latlngs.slice(0,4);
                that.tempQueueLatlngs = that.QueueLatlngs;
                that.current_index = 0;
                that.reroute = true;
                for (var j=0; j < 3; j++) {
                    var length = L.latLng(that.currentLatlngs[j]).distanceTo(L.latLng(that.currentLatlngs[j+1]));
                    var time_seconds = (length / (that.speed / 3.6));
                    that.marker.addLatLng(that.currentLatlngs[j+1], time_seconds*1000);
                }
                that.marker.on('checkpoint', function() {
                    console.log(that.current_index);
                    if (that.QueueLatlngs.length > 1) {
                        that.QueueLatlngs = that.tempQueueLatlngs.slice(1);
                        that.tempQueueLatlngs = that.QueueLatlngs;
                        that.currentLatlngs.push(that.QueueLatlngs[0]);
                        var oldlast = L.latLng(that.currentLatlngs[that.currentLatlngs.length-2]);
                        var newlast = L.latLng(that.currentLatlngs[that.currentLatlngs.length-1]);
                        var duration = oldlast.distanceTo(newlast) / (that.speed / 3.6);
                        that.marker.addLatLng(that.QueueLatlngs[0], duration * 1000);   
                        that.current_index = that.current_index + 1;
                    }
                });
                that.rerouting = true;
                
            } else if (latlngs.length >= 2) {
                that.rerouting = false;
                for (var j=0; j < latlngs.length; j++) {
                    var length = L.latLng(latlngs[j]).distanceTo(L.latLng(latlngs[j+1]));
                    var time_seconds = (length / (that.speed / 3.6));
                    that.marker.addLatLng(latlngs[j+1], time_seconds*1000);
                }
            }
            else {
                that.rerouting = false;
                that.reroute = false;
                that.ready = true;
            }
            that.ready = true;
    }).fail(function(textStatus, error) {
            console.log("Request Failed: " + textStatus + ", " + error);
            that.ready = true;

        });       
    }

    /**
     * Add the marker in the map, autostarting the route
     * @param {L.map} map map used to visualize the MovingMarker
     */
    addTo(map) {
        var that = this;
        if (!this.ready) {
            setTimeout(function(){that.addTo(map)},100);
        } else {
            that.startroute();
            that.marker.addTo(map);
        }
        that.map = map;
    }

    startroute() {
    var that = this;
    if (that.rerouting) {
        that.interval = window.setInterval(function () { 
            var current_index = that.current_index;
                    if (that.reroute && that.rerouting && that.QueueLatlngs.length > 1 && that.currentLatlngs.length > current_index + 2) {
                        var startPoint = that.currentLatlngs[that.current_index + 2];
                        $.getJSON( that.endpoint, {s_lat: startPoint[0],s_lon: startPoint[1],e_lat: that.destination[0],e_lon: that.destination[1],  reroute: true} )
                        .done(function( json ) {
                            that.fetching = true;
                            if (json != null && that.current_index == current_index) {
                                that.tempQueueLatlngs = json[0].slice(1);
                            } else {
                                console.log("Late response -> no rerouting!");
                            }
                            that.fetching = false;
                    }).fail(function(textStatus, error) {
                            console.log("Request Failed: " + textStatus + ", " + error);
                        });
                    }
                    else {
                        console.log("No rerouting!");
            }
        }, that.timer);
    }
    that.marker.on('end', function() {
        that.map.removeLayer(that.marker);
        window.clearInterval(that.interval);
        that.rerouting = false;
    });
    that.marker.start();
    }
};

