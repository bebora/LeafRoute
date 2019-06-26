cmake_minimum_required(VERSION 3.8)
project(lambda-map-generator)
find_package(Boost 1.55.0 REQUIRED COMPONENTS serialization)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
set(CMAKE_CXX_FLAGS  "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
# Add main executable
add_executable(lambda_map_generator
        src/lambda_map_generator.cpp)
target_link_libraries(lambda_map_generator PRIVATE routesfetcher)
