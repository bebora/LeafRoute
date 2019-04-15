
cmake_minimum_required(VERSION 3.7)
project(main)
set(cpprestsdk_DIR /usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/cmake/)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
find_package(cpprestsdk REQUIRED)

add_subdirectory(external/arlib)

add_executable(main routing.cpp)
target_link_libraries(main PRIVATE arlib cpprestsdk::cpprest ${Boost_LIBRARIES})

