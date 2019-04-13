cmake_minimum_required( VERSION 3.5 )

project(LeafRouting)

# Add ARLib directory
add_subdirectory(external/arlib)

add_executable(LeafRouting routing.cpp)
target_link_libraries(LeafRouting PUBLIC arlib)


