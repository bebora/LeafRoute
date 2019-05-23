cmake_minimum_required(VERSION 3.8)
project(main)
set(cpprestsdk_DIR /usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/cmake/)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem program_options)
find_package(aws-lambda-runtime)
include_directories(${Boost_INCLUDE_DIRS})
link_directories(${Boost_LIBRARY_DIRS})
add_subdirectory(external/arlib external/arlib)
add_subdirectory(external/json11 external/json11)
find_package(cpprestsdk REQUIRED)
set(CMAKE_CXX_FLAGS "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
# Add main executable
add_executable(main
        src/routing.cpp
        src/routesfetcher.cpp
        src/routesfetcher.h
        external/json11/json11.cpp
        src/utils.hpp
        src/utils.cpp)
target_link_libraries(main PRIVATE arlib cpprestsdk::cpprest ${Boost_LIBRARIES})
# Add lambda executable
add_executable(lambda
        src/lambda.cpp
        src/routesfetcher.cpp
        src/routesfetcher.h
        external/json11/json11.cpp
        src/utils.hpp
        src/utils.cpp)
target_link_libraries(lambda PRIVATE arlib AWS::aws-lambda-runtime ${Boost_LIBRARIES})
target_compile_features(lambda PRIVATE "cxx_std_17")

aws_lambda_package_target(${PROJECT_NAME})

