# LeafRoute
Map route drawing using [Leaflet](https://github.com/Leaflet/Leaflet).  
Plugins:

- [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
- [Leaflet.Control.Custom](https://github.com/yigityuce/Leaflet.Control.Custom)
- [leaflet-sidebar-v2](https://github.com/nickpeihl/leaflet-sidebar-v2)  
- [typeahead-address-photon](https://github.com/komoot/typeahead-address-photon)
Backend built with Boost.Graph library [arlib](https://github.com/leonardoarcari/arlib)  
Demo [here](https://bebora.github.io/LeafRoute/route.html). Backend must be running at localhost.  
Milan zones from [Comune di Milano](https://geoportale.comune.milano.it/ATOM/SIT/Municipi/Municipi_Dataset_1.xml)
Sliders with constant sum inspired from [constant-sum-sliders](https://github.com/jacobsolomon15/constant-sum-sliders)  

## Deploy with Docker
```
docker build --tag=leafroute .
docker run -p 1337:1337 -td leafroute
```
Simple test with curl:
```
curl http://localhost:1337/getroutes?&s_lat=45.4667971&s_lon=9.1904984&e_lat=45.4783918&e_lon=9.224554764332705&reroute=false
 ```
# TODO
- Add bootstrap sidebar to setup and start the simulation
- Add documentation for RoutesDealer
- Join some custom css files
- Dynamically create sliders with any GeoJSON containing zones
- Add function to redraw slider background after any value change

