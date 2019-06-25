cmake_minimum_required(VERSION 3.8)
project(cppserver)
set(cpprestsdk_DIR /usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/cmake/)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem program_options serialization)
include_directories(${Boost_INCLUDE_DIRS})
include_directories(external/kdtree external/kdtree)
link_directories(${Boost_LIBRARY_DIRS})
include_directories("${PROJECT_SOURCE_DIR}/external/kdtree")
find_package(cpprestsdk REQUIRED)
set(CMAKE_CXX_FLAGS  "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
# Add main executable
add_executable(cppserver
        src/routing.cpp)
target_link_libraries(cppserver LINK_PUBLIC routesfetcher cpprestsdk::cpprest)

