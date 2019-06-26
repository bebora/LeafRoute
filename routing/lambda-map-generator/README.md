## lambda_map_generator
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
