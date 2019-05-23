# Installing required libraries
[cpprestsdk](https://github.com/microsoft/cpprestsdk) and [aws-lambda-cpp](https://github.com/awslabs/aws-lambda-cpp) are require to compile.  
cpprestsdk can be installed from many package managers or from source. To build from source make sure you have [all dependencies](https://github.com/Microsoft/cpprestsdk/wiki/How-to-build-for-Linux) installed and then run these commands:
```
git clone https://github.com/microsoft/cpprestsdk /tmp/cpprestsdk
cd /tmp/cpprestsdk
mkdir build
cd build
cmake -G Ninja .. \
    -DBUILD_TESTS=OFF \
    -DBUILD_SAMPLES=OFF \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DCMAKE_INSTALL_LIBDIR=lib
ninja
sudo ninja install
```
aws-lambda-cpp should be installed from source. Make sure you have [all dependencies](https://github.com/awslabs/aws-lambda-cpp#prerequisites) installed and run these commands:
```
git clone https://github.com/awslabs/aws-lambda-cpp /tmp/aws-lambda-cpp
cd /tmp/aws-lambda-cpp
mkdir build
cd build
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DCMAKE_INSTALL_LIBDIR=lib
make
sudo make install
```
# Building
`cmake-build-debug` directory is for building and debugging the project as a standard executable. `weights` and `ids` **must be manually added**.  

Standard Docker image (no AWS) can be built with
```
docker build --tag=leafroute .
docker run -p 1337:1337 -td leafroute
```

# Testing
Run cmake-build-debug/main or the Docker image and test with curl:
```
curl http://localhost:1337/getroutes?&s_lat=45.4667971&s_lon=9.1904984&e_lat=45.4783918&e_lon=9.224554764332705&reroute=false
 ```
# Status
- [x] cmake-build-debug method working  
- [x] docker standard method working  
- [ ] docker-lambda method missing

