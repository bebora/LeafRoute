var strokePolyline = function(latlngs, options={}) {
    defaultOptions = {
        outerColor: '#000',
        innerColor: '#fff',
        outerWeight: 8.5,
        innerWeight: 6
    }
    options = {...defaultOptions, ...options};
    ret = new L.featureGroup();
    ret.addLayer(new L.Polyline(latlngs, {weight: options.outerWeight, color: options.outerColor}));
    ret.addLayer(new L.Polyline(latlngs, {weight: options.innerWeight, color: options.innerColor}));
    return ret;
}
