cmake_minimum_required(VERSION 3.8)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem program_options serialization)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
add_subdirectory(external/json11 json11)
add_subdirectory(external/arlib arlib)
add_subdirectory(external/kdtree kdtree)
set(CMAKE_CXX_FLAGS  "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
# Add main executable
add_library(routesfetcher
        src/routesfetcher.cpp
        src/routesfetcher.h
        src/utils.hpp
        src/utils.cpp)
target_link_libraries(routesfetcher PUBLIC kdtree arlib json11 ${Boost_LIBRARIES})
target_include_directories (routesfetcher PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})


