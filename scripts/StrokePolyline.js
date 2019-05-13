var strokePolyline = function(latlngs, options={}) {
    defaultOptions = {
        outerColor: '#000',
        innerColor: '#fff',
        outerWeight: 8.5,
        innerWeight: 6,
        groupId: null,
        onClick: function(){}
    }
    options = {...defaultOptions, ...options};
    ret = new L.featureGroup();
    ret.addLayer(new L.Polyline(latlngs,
        {
            weight: options.outerWeight,
            color: options.outerColor,
            groupId: options.groupId
        }).on('click', options.onClick));
    ret.addLayer(new L.Polyline(latlngs,
        {
            weight: options.innerWeight,
            color: options.innerColor,
            groupId: options.groupId
        }).on('click', options.onClick));
    return ret;
}
