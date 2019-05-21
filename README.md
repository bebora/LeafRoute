# LeafRoute
Map route drawing using [Leaflet](https://github.com/Leaflet/Leaflet).  
Plugins:

- [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
- [Leaflet.Control.Custom](https://github.com/yigityuce/Leaflet.Control.Custom)
- [leaflet-sidebar-v2](https://github.com/nickpeihl/leaflet-sidebar-v2)  
- [typeahead-address-photon](https://github.com/komoot/typeahead-address-photon)  

Backend built with Boost.Graph library [arlib](https://github.com/leonardoarcari/arlib).  
Backend Json handling done with [json11](https://github.com/dropbox/json11)    
Demo [here](https://bebora.github.io/LeafRoute/singleroute.html). Backend must be running at localhost.  
Milan zones from [Comune di Milano](https://geoportale.comune.milano.it/ATOM/SIT/Municipi/Municipi_Dataset_1.xml).
Sliders with constant sum inspired from [constant-sum-sliders](https://github.com/jacobsolomon15/constant-sum-sliders).  


# TODO
- Add documentation for RoutesDealer
- Join some custom css files
- Dynamically create sliders with any GeoJSON containing zones
- Add function to redraw slider background after any value change
- Add AWS Lambda integration
- Improve memory footprint. After every request the total memory used by the executable grows. This affects both Docker Alpine builds and regular builds (tested on Manjaro) 
