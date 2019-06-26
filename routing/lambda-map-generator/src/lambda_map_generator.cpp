#include <boost/graph/adj_list_serialize.hpp>
#include <boost/archive/text_oarchive.hpp>
#include <iostream>
#include <sstream>
#include <boost/archive/text_iarchive.hpp>
#include <src/routesfetcher.h>

using Graph = boost::adjacency_list<boost::vecS, boost::vecS,
        boost::bidirectionalS, Location,
        boost::property<boost::edge_weight_t, float>>;

int main(int argc, char* argv[]) {
    Graph g;
    auto start = chrono::steady_clock::now();
    location_graph_from_string("weights", "ids", g, false);
    auto end = chrono::steady_clock::now();
    logElapsedMillis("Loaded coordinates and weights", start, end);
    start = chrono::steady_clock::now();
    std::ofstream oss("data.btl");
    {
        boost::archive::text_oarchive oa(oss);
        oa << g;
    }
    end = chrono::steady_clock::now();
    logElapsedMillis("Dumped to file", start, end);
}
