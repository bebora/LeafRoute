# LeafRoute
Map route drawing using [Leaflet](https://github.com/Leaflet/Leaflet).
Plugins:

- [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
- [Leaflet.Control.Custom](https://github.com/yigityuce/Leaflet.Control.Custom)

Backend built with Boost.Graph library [arlib](https://github.com/leonardoarcari/arlib)  
Demo [here](https://bebora.github.io/LeafRoute/route.html). Backend must be running at localhost.  
Milan zones from [Comune di Milano](https://geoportale.comune.milano.it/ATOM/SIT/Municipi/Municipi_Dataset_1.xml)
# TODO
- Fix ARLibMarker indices to add the remaining route using ARLib (if response is correct) or initial planned route (without any response)
- Add bootstrap sidebar to setup and start the simulation
- Add function for random generation of points inside a polygon (using turf.js)
- Add documentation
