#ifndef MAIN_UTILS_HPP
#define MAIN_UTILS_HPP

#include <string>
using namespace std;

bool parseBoolean(const string &str) {
    return str == "true" || str == "yes" || str == "on";
}

#endif //MAIN_UTILS_HPP
