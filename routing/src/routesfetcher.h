#ifndef MAIN_ROUTESFETCHER_H
#define MAIN_ROUTESFETCHER_H

#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_traits.hpp>

#include <cpprest/json.h>
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


struct Location{
    double lon;
    double lat;
};

double toRadians(const double degree);
double distance(double lat1, double long1,
                     double lat2, double long2);

template <typename Graph>
void location_graph_from_string(std::string weight_file, std::string location_file, Graph &g) {
    using namespace std;
    typedef pair<int,int> Edge;
    vector<Edge> edges;
    vector<double> weights;
    vector<Location> locations;
    string line;
    ifstream rfile;
    rfile.open(weight_file);
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            int a,b;
            double weight;
            istringstream stream (line);
            stream >> a >> b >> weight;
            edges.push_back(Edge(a,b));
            weights.push_back(weight);
        }
        rfile.close();
    }

    rfile.open(location_file);
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            Location l;
            double lon,lat;
            istringstream stream (line);
            stream >> lon >> lat;
            l = {}; // will zero all fields
            l.lat = lat;
            l.lon = lon;
            locations.push_back(l);
        }
        rfile.close();
    }
    Graph G(edges.begin(), edges.end(), weights.begin(), locations.size());
    g = G;
    auto index = get(boost::vertex_index, g);
    std::for_each(vertices(g).first, vertices(g).second,
                  [&g, locations, index](auto const &v) {g[v].lon = locations[index[v]].lon;
                      g[v].lat = locations[index[v]].lat; });
}

template<typename Graph, typename Vertex>
void get_vertex(double lat1, double long1,
                  Graph g, Vertex &v) {
    auto vs = boost::vertices(g);
    double min = DBL_MAX;
    for (auto vit = vs.first; vit != vs.second; vit++) {
        double curr = distance(lat1, long1, g[*vit].lat, g[*vit].lon);
        if (curr == 0) {
            v = *vit;
            break;
        }
        else if (curr < min) {
            v = *vit;
            min = curr;
        }
    }
}

template<typename Graph, typename Vertex>
web::json::value get_location_path(arlib::Path<Graph> const &path, Vertex s, Vertex t,
                                   Graph const g) {
    using namespace web::json;
    using namespace boost;
    using namespace std;
    typename property_map<Graph, vertex_index_t>::type
            index = get(vertex_index, g);
    auto v_it = s;
    auto v_end = t;
    vector<value> location_path;
    vector<value> l = {g[index[v_it]].lat, g[index[v_it]].lon};
    location_path.push_back(web::json::value::array(l));
    cout << v_it;
    while (v_it != v_end) {
        auto[curr_edge, final_edge]= out_edges(v_it, path);
        v_it = target(*curr_edge, path);
        cout << " to " << v_it;
        l = {g[index[v_it]].lat, g[index[v_it]].lon};
        location_path.push_back(web::json::value::array(l));
    }
    cout << endl << endl;
    return value::array(location_path);
}

template<typename Graph, typename Vertex>
web::json::value get_alternative_routes(Graph const &g, Vertex s,
                                                Vertex t, int k, double theta, bool reroute,
                                                int max_nb_updates = 10, int max_nb_steps = 100000) {
    using namespace std;
    using namespace boost;
    using namespace web::json;
    using arlib::routing_kernels;
    auto weight = boost::get(boost::edge_weight, g);
    auto predecessors = arlib::multi_predecessor_map<Vertex>{};
    vector<value> location_paths;
    auto timeout = std::chrono::milliseconds{50};
    if (reroute)
        penalty(g, weight, predecessors, s, t, k, theta,  0.1, 0.1, max_nb_updates, max_nb_steps,
            routing_kernels::bidirectional_dijkstra, arlib::timer{timeout});
    else
        penalty(g, weight, predecessors, s, t, k, theta,  0.1, 0.1, max_nb_updates, max_nb_steps,
                routing_kernels::bidirectional_dijkstra);
    auto paths = to_paths(g, predecessors, weight, s, t);
    for (auto const &path : paths) {
        auto location_path = get_location_path(path,s,t, g);
        location_paths.push_back(location_path);
    }
    return value::array(location_paths);
}



#endif //MAIN_ROUTESFETCHER_H