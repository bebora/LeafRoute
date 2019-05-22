#include <string>
#include <chrono>
#include <iostream>
using namespace std;

bool parseBoolean(const string &str) {
    return str == "true" || str == "yes" || str == "on";
}

void logElapsedMillis(
        const std::string reason,
        const std::chrono::time_point<std::chrono::steady_clock> start,
        const std::chrono::time_point<std::chrono::steady_clock> end) {
    cout << reason << " in "
         << chrono::duration_cast<chrono::milliseconds>(end - start).count()
         << " ms" << endl;
}