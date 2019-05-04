
cmake_minimum_required(VERSION 3.7)
project(main)
set(cpprestsdk_DIR /usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/cmake/)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem program_options)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
add_subdirectory(external/arlib)
find_package(cpprestsdk REQUIRED)
set(CMAKE_CXX_FLAGS "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
add_executable(main routing.cpp routesfetcher.cpp routesfetcher.h)
target_link_libraries(main PRIVATE arlib cpprestsdk::cpprest ${Boost_LIBRARIES})

