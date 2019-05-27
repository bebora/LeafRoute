# LeafRoute
LeafRoute is a routing service with a C++ back-end and an HTML/JavaScript frontend.  
Its main purpose is to use and stress the Alternative Routing Library for Boost.Graph [ARLib](https://github.com/leonardoarcari/arlib).
## Frontend
The frontend is built with [Leaflet](https://github.com/Leaflet/Leaflet).  
LeafLet plugins used:
- [Leaflet.MovingMarker](https://github.com/ewoken/Leaflet.MovingMarker)
- [leaflet-sidebar-v2](https://github.com/nickpeihl/leaflet-sidebar-v2)  

Other scripts and libraries used:
- [Bootstrap](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/)
- [jQuery](https://jquery.com/)
- [typeahead-address-photon](https://github.com/komoot/typeahead-address-photon) 
- [Turf.js](https://turfjs.org/)
- Sliders with constant sum inspired from [constant-sum-sliders](https://github.com/jacobsolomon15/constant-sum-sliders).  

The default zones in the simulation page are from [Comune di Milano](https://geoportale.comune.milano.it/ATOM/SIT/Municipi/Municipi_Dataset_1.xml).

## Backend
The backend can be run in three ways: 
- Compiled and run directly from source
- Built and run with Docker
- Compiled into a zip file that can be uploaded to AWS Lambda 
 
The instructions can be found in routing/README.md

The Docker version can also be downloaded from [Docker Hub](https://hub.docker.com/r/bebora/leafroute).  
Libraries used for the backend:
- [ARLib](https://github.com/leonardoarcari/arlib)
- [aws-lambda-cpp](https://github.com/awslabs/aws-lambda-cpp)
- [Boost](https://www.boost.org/)
- [cpprestsdk](https://github.com/microsoft/cpprestsdk)
- [json11](https://github.com/dropbox/json11)

# Demo   
Demo [here](https://bebora.github.io/LeafRoute/singleroute.html).  
Backend must be running at the endpoint in the settings (default: localhost).  


# TODO
- Speed up creation of geocoordinate path from Arlib::path
- Join some custom css files
- Dynamically create sliders with any GeoJSON containing zones
- Add function to redraw slider background after any value change
