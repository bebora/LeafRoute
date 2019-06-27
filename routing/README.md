# Installing required libraries
[cpprestsdk](https://github.com/microsoft/cpprestsdk) and [aws-lambda-cpp](https://github.com/awslabs/aws-lambda-cpp) are required to compile.  
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
    -DCMAKE_INSTALL_PREFIX=/usr
make
sudo make install
```
# Building
## Standard compiling
```
git submodule init
git submodule update
mkdir -p build
cd build
cmake ..
make cppserver
```  
Executable will be in `cpprestsdk` folder  
`weights` and `ids` **must be manually added** or the executable will load an empty map.  

## Standard Docker image
Compile the executable inside Alpine and run the rest service from the container
```
docker build --tag=leafroute .
docker run -p 1337:1337 -td leafroute
```
## AWS Lambda
Generate a zip file to upload to AWS Lambda, which should be called from a dedicated AWS API Gateway service. The API Gateway must be configured to pass received arguments to the Lambda function by checking the **Use Lambda Proxy integration** box.  
Depending on the size it may be necessary to upload the zip first on S3 and then load the Lambda code from S3.
```
git submodule init
git submodule update
mkdir -p build
cd build
cmake ..
make lambda
make aws-lambda-package-lambda
```
zip file will be in `lambda` folder
`data.btl` **must be manually added** to the root of the generated zip file or the executable will load an empty map.  

## lambda_map_generator
Lambda executable uses a different method to load the graph
Usage: 
```
mkdir build
cd build
cmake ..
make lambda_map_generator 
```
Copy ids and weights (generated from osmprovider.py) in build folder and then
```
./lambda_map_generator
```
`data.btl` will be generated in current folder  
Result: Boost serialized graph currently used in Lambda implementation

# Testing
Run build/cppserver or the Docker image and test with curl:
```
curl http://localhost:1337/getroutes?&s_lat=45.4667971&s_lon=9.1904984&e_lat=45.4783918&e_lon=9.224554764332705&reroute=false
 ```
# Status
- [x] standard build method working  
- [x] docker standard method working  
- [x] lambda method working

