#ifndef MAIN_ROUTESFETCHER_H
#define MAIN_ROUTESFETCHER_H

#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_traits.hpp>
#include "../external/json11/json11.hpp"
#include <arlib/esx.hpp>
#include <arlib/graph_utils.hpp>
#include <arlib/multi_predecessor_map.hpp>
#include <arlib/onepass_plus.hpp>
#include <arlib/path.hpp>
#include <arlib/penalty.hpp>
#include <arlib/routing_kernels/types.hpp>
#include <arlib/terminators.hpp>
#include <string>
#include <vector>
#include <fstream>
#include <iostream>
#include <cmath>
#include <float.h>
#include <chrono>
#include "utils.hpp"
#include <filesystem>
#include "../external/kdtree/KDTree.h"


struct Location{
    float lon;
    float lat;

    template<class Ar>
    void serialize(Ar& ar, const unsigned int) {
        ar & lon;
        ar & lat;
        //
    }
};

float toRadians(const float degree);
float distance(float lat1, float long1,
                     float lat2, float long2);

template <typename Graph>
std::vector<std::pair<Point<2>, int>> location_graph_from_string(std::string weight_file, std::string location_file, Graph &g, bool kdtree) {
    auto fsize = filesystem::file_size(weight_file);
    std::vector<std::pair<Point<2>,int>> data;
    std::cout << "Weights size: " << float(fsize) / 1000000 << " MB"<< std::endl;
    fsize = filesystem::file_size(location_file);
    std::cout << "Ids size: " << float(fsize) / 1000000 << " MB"<< std::endl;
    using namespace std;
    typedef pair<int,int> Edge;
    vector<Edge> edges;
    vector<float> weights;
    vector<Location> locations;
    string line;
    ifstream rfile;
    rfile.open(weight_file);
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            int a,b;
            float weight;
            istringstream stream (line);
            stream >> a >> b >> weight;
            edges.push_back(Edge(a,b));
            weights.push_back(weight);
        }
        rfile.close();
    }

    rfile.open(location_file);
    int i = 0;
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            Location l;
            float lon,lat;
            istringstream stream (line);
            stream >> lon >> lat;
            l = {}; // will zero all fields
            l.lat = lat;
            l.lon = lon;
            locations.push_back(l);
            if (kdtree) {
                std::pair<Point<2>,int> temp(Point<2>(lat,lon),i);
                data.push_back(temp);
            }
            i++;
        }
        rfile.close();
    }
    Graph G(edges.begin(), edges.end(), weights.begin(), locations.size());
    g = G;
    auto index = get(boost::vertex_index, g);
    std::for_each(vertices(g).first, vertices(g).second,
                  [&g, locations, index](auto const &v) {g[v].lon = locations[index[v]].lon;
                      g[v].lat = locations[index[v]].lat; });
    return data;
}

template<typename Graph, typename Vertex>
void get_vertex(float lat1, float long1,
                  Graph &g, Vertex &v) {
    float min = FLT_MAX;
    for (auto [v_it, v_end] = vertices(g); v_it != v_end; ++v_it) {
        float curr = distance(lat1, long1, g[*v_it].lat, g[*v_it].lon);
        if (curr == 0) {
            v = *v_it;
            break;
        }
        else if (curr < min) {
            v = *v_it;
            min = curr;
        }
    }
}

template<typename Vertex>
void get_vertex(float lat1, float long1,
        KDTree<2, int> &tree, Vertex &v) {
    Point<2> key(lat1,long1);
    v = tree.kNNValue(key, 1);
    
}


template<typename Graph, typename Vertex>
json11::Json get_location_path(arlib::Path<Graph> const &path, Vertex &s, Vertex &t,
                                   Graph const &g) {
    using namespace json11;
    using namespace boost;
    using namespace std;
    typename property_map<Graph, vertex_index_t>::type
            index = get(vertex_index, g);
    auto v_it = s;
    auto v_end = t;
    // Each array is a coordinate in the lat,lng format
    vector<Json::array> json_arr;
    auto start_path = chrono::steady_clock::now();
    auto l = Json::array {g[index[v_it]].lat, g[index[v_it]].lon,0};
    json_arr.push_back(l);
    //cout << v_it;
    while (v_it != v_end) {
        auto[curr_edge, final_edge] = out_edges(v_it, path);
        v_it = target(*curr_edge, path);
        auto weight = get(boost::edge_weight_t(), g, *curr_edge);
        //cout << " to " << v_it;
        json_arr.push_back(Json::array {g[index[v_it]].lat, g[index[v_it]].lon, weight});
    }
    //cout << endl << endl;
    auto end_path = chrono::steady_clock::now();
    logElapsedMillis("Got single path in", start_path, end_path);
    return json_arr;
}

template<typename Graph, typename Vertex>
json11::Json get_alternative_routes(Graph const &g, Vertex &s,
                                                Vertex &t, int k, float theta, bool reroute,
                                                int max_nb_updates = 10, int max_nb_steps = 100000) {
    using namespace std;
    using namespace boost;
    using namespace json11;
    using arlib::routing_kernels;
    auto weight = boost::get(boost::edge_weight, g);
    auto predecessors = arlib::multi_predecessor_map<Vertex>{};
    vector<Json> location_paths;
    auto timeout = std::chrono::milliseconds{900};
    auto start = chrono::steady_clock::now();
    try {
        if (reroute)
            penalty(g, weight, predecessors, s, t, k, theta, 0.1, 0.1, max_nb_updates, max_nb_steps,
                    routing_kernels::bidirectional_dijkstra, arlib::timer{timeout});
        else
            penalty(g, weight, predecessors, s, t, k, theta, 0.1, 0.1, max_nb_updates, max_nb_steps,
                    routing_kernels::bidirectional_dijkstra);
    } catch (const arlib::details::target_not_found&) {
        throw std::invalid_argument("Path not found");
    }
    auto end = chrono::steady_clock::now();
    logElapsedMillis("Applied penalty", start, end);
    start = chrono::steady_clock::now();
    auto paths = to_paths(g, predecessors, weight, s, t);
    end = chrono::steady_clock::now();
    logElapsedMillis("Generated paths arlib", start, end);
    for (auto const &path : paths) {
        auto location_path = get_location_path(path, s, t, g);
        location_paths.push_back(location_path);
    }
    end = chrono::steady_clock::now();
    logElapsedMillis("Generated paths", start, end);
    return location_paths;
}



#endif //MAIN_ROUTESFETCHER_H
