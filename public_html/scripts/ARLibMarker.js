L.Marker.MovingMarker.ARLibMarker = L.Marker.MovingMarker.extend({
    /**
     * Construct an ARLibMarker, a wrapper of a MovingMarker, given the waypoints and set it ready when it's ready to be added to the LeafLet map
     * @param {Array} startPoint array with latitude and longitude of the starting point
     * @param {*} destination array with the latitude and longitude of destination point
     * @param {boolean} rerouting whether fetch better routes periodically (milliseconds defined by timer
     * @param {int} speed average km/s used run across the route
     * @param {L.polyline} polyline line to update when marker is moving
     * @param {string} endpoint url of the routing machine
	*/
    initialize: function (startPoint, destination, rerouting = true, speed = 1, timer = 1000, polyline = null, endpoint = 'http://localhost:1337/getroutes', stats=null) {
        this.polyline = polyline;
        this.icon = L.icon({iconUrl: 'icons/circlemarker.svg', iconSize: [21, 21]});
        this.speed = speed;
        this.timer = timer;
        this.rerouting = rerouting;
        this.endpoint = endpoint;
        this.current_index = 1;
        this.ready = false;
        this.failed = true;
        this.stats = stats;
        let that = this;
        if (!Array.isArray(startPoint[0])){
            let startTime = new Date().getTime();
            $.getJSON( this.endpoint,
                {
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: destination[0],
                    e_lon: destination[1],
                    reroute: this.rerouting,
                    n_routes: 1
                })
            .done(function( json ) {
                let endTime = new Date().getTime();
                stats.times.push({
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: destination[0],
                    e_lon: destination[1],
                    requestTime: endTime - startTime,
                    failed: false,
                    timestamp: Date.now()
                });
                that._buildPath(that,json[0]);
                that.ready = true;
                that.failed = false;
            }).fail(function(textStatus, error) {
                let stringError = textStatus.status + ' ' + textStatus.statusText + ': ' + textStatus.responseText;
                let endTime = new Date().getTime();
                console.log('Request failed | ' + stringError);
                that.stats.errors.push({
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: destination[0],
                    e_lon: destination[1],
                    requestTime: endTime - startTime,
                    errorMessage: stringError,
                    failed: true,
                    timestamp: Date.now()
                });
                that.failed = true;
                that.ready = true;
            });
        }
        else {
            that._buildPath(that, startPoint);
            that.ready = true;
            that.failed = false;
        }       
    },
    /**
     * Util function to construct the full route and the related Queues
     * @param {} that scope of the ARLibMarker class
     * @param {Array} latlngs list of coordinates used for the route
     */
    _buildPath: function(that, latlngs) {
        L.Marker.MovingMarker.prototype.initialize.call(that,[latlngs[0]], 0, {icon: this.icon});
        that.destination = latlngs[latlngs.length-1];
        if (latlngs.length >= 4) {
            that.QueueLatlngs = latlngs.slice(3);
            that.currentLatlngs = latlngs.slice(0,4);
            that.tempQueueLatlngs = that.QueueLatlngs;
            that.current_index = 0;
            for (let j=0; j < 3; j++) {
                L.Marker.MovingMarker.prototype.addLatLng.call(that, that.currentLatlngs[j+1], that.currentLatlngs[j+1][2]*1000 / that.speed);
            }            
        } else if (latlngs.length >= 2) {
            for (let j=1; j < latlngs.length; j++) {
                L.Marker.MovingMarker.prototype.addLatLng.call(that, latlngs[j], latlngs[j][2]*1000 / that.speed);
            }
            that.rerouting = false;
        }
        else {
            that.rerouting = false;
        }
    },

    /**
     * Util function for rerouting machine, fetching the endpoint for different paths from original
     */
    _fetchroute: function() { 
        //console.log('fetching');
        let that = this;
        let current_index = that.current_index;
        if (that.rerouting && that.QueueLatlngs.length > 1 && that.currentLatlngs.length > current_index + 2) {
            let startPoint = that.currentLatlngs[that.current_index + 2];
            let startTime = new Date().getTime();
            $.getJSON( that.endpoint,
                {
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: that.destination[0],
                    e_lon: that.destination[1],
                    reroute: true,
                    n_routes: 1
                } )
            .done(function( json ) {
                let endTime = new Date().getTime();
                that.stats.times.push({
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: that.destination[0],
                    e_lon: that.destination[1],
                    requestTime: endTime - startTime,
                    failed: false,
                    timestamp: Date.now()
                });
                that.fetching = true;
                if (json != null && Array.isArray(json) && json.length && that.current_index === current_index) {
                    that.tempQueueLatlngs = json[0].slice(1);
                    //console.log('rerouting!');
                } else {
                    //console.log('Late response -> no rerouting!');
                }
                that.fetching = false;
            }).fail(function(textStatus, error) {
                console.log(error);
                let stringError = textStatus.status + ' ' + textStatus.statusText + ': ' + textStatus.responseText;
                console.log('Request failed | ' +  stringError);
                let endTime = new Date().getTime();
                that.stats.errors.push({
                    s_lat: startPoint[0],
                    s_lon: startPoint[1],
                    e_lat: that.destination[0],
                    e_lon: that.destination[1],
                    requestTime: endTime - startTime,
                    errorMessage: stringError,
                    failed: true,
                    timestamp: Date.now()
                });
            });
        }
        else {
            //console.log('No rerouting!');
        }
    },

    /**
     * Update at checkpoint the MovingMarker with new coordinates to assure a non-blocking movement
     */
    _update: function() {
        //console.log('updating...');
        let that = this;
        //console.log(that.current_index);
        try {
            if (that.QueueLatlngs.length > 1) {
                that.QueueLatlngs = that.tempQueueLatlngs.slice(1);
                that.tempQueueLatlngs = that.QueueLatlngs;
                that.currentLatlngs.push(that.QueueLatlngs[0]);
                //TODO following two statements are useless, remove if unnecessary
                //let oldlast = L.latLng(that.currentLatlngs[that.currentLatlngs.length-2]);
                //let newlast = L.latLng(that.currentLatlngs[that.currentLatlngs.length-1]);
                L.Marker.MovingMarker.prototype.addLatLng.call(that, that.QueueLatlngs[0], that.QueueLatlngs[0][2]*1000 / that.speed);
            }
        }
        catch(e) {
            _stop();
            return;
        }
        that.current_index = that.current_index + 1; 
    },

    /**
     * Remove the marker from the map and stop fetching routes.
     */
    _stop: function() {
        //console.log('stopping...');
        L.Marker.MovingMarker.prototype.stop.call(this);
        let that = this;
        if (that.map != null) 
            that.map.removeLayer(that);
        if (that.interval != null) 
            window.clearInterval(that.interval);
        that.rerouting = false;
    },

    /**
     * Pause the marker and the route fetching
     */
    pause: function() {
        L.Marker.MovingMarker.prototype.pause.call(this);
        window.clearInterval(this.interval);
    },

    /**
     * Restart the marker after resume
     */
    resume: function() {
        let that = this;
        L.Marker.MovingMarker.prototype.resume.call(this);
        if (!that.interval)
            that.interval = that.interval = window.setInterval(function() {
                that._fetchroute();
            }, that.timer);
    },
    /**
     * Add the marker in the map, autostarting the route
     * @param {L.map} map used to visualize the MovingMarker
     */
    addTo: function(map) {
        let that = this;
        if (!this.ready) {
            setTimeout(function(){that.addTo(map)},100);
        } else {
            if (!this.failed) {
                that._startRoute();
                L.Marker.MovingMarker.prototype.addTo.call(that, map);
            }
        }
        that.map = map;
    },


    _update_polyline: function() {
        let tempQueue = this.QueueLatlngs.slice(1);
        let full_line = (this.currentLatlngs.concat(tempQueue));
        full_line = full_line.slice(this.current_index+1);
        full_line.unshift(L.Marker.prototype.getLatLng.call(this));
        if (Array.isArray(this.polyline)){
            for (i = 0; i < polyline.length; i++) {
                this.polyline[i].setLatLngs(full_line);
            }
        }
        else {
            this.polyline.setLatLngs(full_line);
        }
    },
    /**
     * Set up events triggered function and start the marker
     */
    _startRoute: function() {
        let that = this;
        if (this.polyline != null) {
            that.on('move', function() {
                that._update_polyline();
            });
        }
        that.on('checkpoint',function() {
            that._update();
        }, that);
        if (that.rerouting) {
            that.interval = window.setInterval(function() {
                that._fetchroute();
            }, that.timer);
        }
        that.on('end', function() {
            that.off('checkpoint',that);
            that.off('end',that);
            that._stop();
        },that);
        L.Marker.MovingMarker.prototype.start.call(that);    
    }
});



