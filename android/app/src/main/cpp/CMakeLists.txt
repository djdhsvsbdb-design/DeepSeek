cmake_minimum_required(VERSION 3.22.1)
project(nodebridge)

add_library(nodebridge SHARED node_bridge.cpp)
target_include_directories(nodebridge PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/node_headers)
add_library(node SHARED IMPORTED)
set_target_properties(node PROPERTIES IMPORTED_LOCATION ${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libnode.so)
target_link_libraries(nodebridge node log android dl)
