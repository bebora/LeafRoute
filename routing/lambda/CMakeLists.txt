cmake_minimum_required(VERSION 3.8)
project(lambda)
find_package(Boost 1.55.0 REQUIRED COMPONENTS system filesystem program_options serialization)
find_package(aws-lambda-runtime)
set(CMAKE_CXX_FLAGS  "-O3 -Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
# Add main executable
add_executable(lambda
        src/lambda.cpp)
target_link_libraries(lambda PRIVATE AWS::aws-lambda-runtime ${Boost_LIBRARIES} routesfetcher)
target_compile_features(lambda PRIVATE "cxx_std_17")
aws_lambda_package_target(lambda)
