
#include <cpprest/http_client.h>
#include <cpprest/filestream.h>
#include <cpprest/http_listener.h>
#include <cpprest/json.h>
#include <cpprest/uri.h>
#include <cpprest/ws_client.h>
#include <cpprest/containerstream.h>
#include <cpprest/interopstream.h>
#include <cpprest/rawptrstream.h>
#include <cpprest/producerconsumerstream.h>

#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_traits.hpp>

#include <arlib/path.hpp>
#include <arlib/graph_utils.hpp>
#include <arlib/multi_predecessor_map.hpp>
#include <arlib/penalty.hpp>
#include <arlib/routing_kernels/types.hpp>


#include <string>
#include <vector>
#include <fstream>
#include <iostream>

using namespace utility;
using namespace web;
using namespace web::http;
using namespace web::http::client;
using namespace concurrency::streams;
using namespace web::http::experimental::listener;
using namespace web::experimental::web_sockets::client;
using namespace web::json;
using namespace arlib;


using namespace std;

struct Location{
    double lon;
    double lat;
};

using Graph = boost::adjacency_list<boost::vecS, boost::vecS,
        boost::bidirectionalS, Location,
        boost::property<boost::edge_weight_t, int>>;
using Vertex = typename boost::graph_traits<Graph>::vertex_descriptor;
using Edge = typename boost::graph_traits<Graph>::edge_descriptor;

//Add path Location value to a std::vector path, excluding the target vertex
vector<Location> get_location_path(arlib::Path<Graph> const &path,
                Graph const g) {
    using namespace boost;
    vector<Location> location_path;
    Location l;
    for (auto [v_it, v_end] = vertices(path); v_it != v_end; ++v_it) {
        for (auto [e_it, e_end] = out_edges(*v_it, path); e_it != e_end; ++e_it) {
            l = {};
            l.lat = g[source(*e_it, path)].lat;
            l.lon = g[source(*e_it, path)].lon;
            location_path.push_back(l);
        }
    }
    return location_path;
}



template<typename Graph>
vector<vector<Location>> get_alternative_routes(Graph const &g, Vertex s,
                                                  Vertex t, int k, double theta,
                                                  int max_nb_updates = 10, int max_nb_steps = 100000) {
    using namespace boost;
    auto predecessors = arlib::multi_predecessor_map<Vertex>{};
    auto weight = boost::get(boost::edge_weight, g); // Get Edge WeightMap
    vector<vector<Location>> location_paths;

    penalty(g, predecessors, s, t, k, theta,  max_nb_updates, max_nb_steps, routing_kernels::bidirectional_dijkstra);
    auto paths = to_paths(g, predecessors, weight, s, t);
    for (auto const &path : paths) {
        auto location_path = get_location_path(path, g);
        Location l = {};
        l.lat = g[t].lat;
        l.lon = g[t].lon;
        location_path.push_back(l);
        location_paths.push_back(location_path);
    }
    return location_paths;
}

class RoutesDealer
{
public:
    RoutesDealer() {}
    RoutesDealer(utility::string_t url, Graph g);

    pplx::task<void> open() { return m_listener.open(); }
    pplx::task<void> close() { return m_listener.close(); }

private:
    void handle_get(http_request message);

    http_listener m_listener;
};


RoutesDealer::RoutesDealer(utility::string_t url, Graph g) : m_listener(url)
{

    m_listener.support(methods::GET, std::bind(&RoutesDealer::handle_get, this, std::placeholders::_1));
}

void RoutesDealer::handle_get(http_request message)
{

    //TODO convert to a polygon using arlib routing algorithm
    value geojson = value::object();
    geojson["type"] = value::string("Feature");
    geojson["geometry"] = value::object();
    geojson["geometry"]["prova"] = value::string(message.extract_string(true).get());
    http_response response(status_codes::OK);
    response.set_body(geojson);

    message.reply(response);

}



using Graph = boost::adjacency_list<boost::vecS, boost::vecS,
                                    boost::bidirectionalS, Location,
                                    boost::property<boost::edge_weight_t, int>>;
using Vertex = typename boost::graph_traits<Graph>::vertex_descriptor;
using Edge = typename boost::graph_traits<Graph>::edge_descriptor;

std::unique_ptr<RoutesDealer> g_httpDealer;

int main() {
    typedef pair<int,int> Edge;
    vector<Edge> edges;
    vector<int> weights;
    vector<Location> locations;
    string line;
    ifstream rfile;
    rfile.open("weights");
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            int a,b,weight;
            istringstream stream (line);
            stream >> a >> b >> weight;
            edges.push_back(Edge(a,b));
            weights.push_back(weight);
        }
        rfile.close();
    }

    rfile.open("ids");
    if (rfile.is_open()) {
        while (getline(rfile, line)) {
            Location l;
            double lon,lat;
            istringstream stream (line);
            stream >> lon >> lat;
            l = {}; // will zero all fields in C++
            l.lat = lat;
            l.lon = lon;
            locations.push_back(l);
        }
        rfile.close();
    }

    Graph g(edges.begin(), edges.end(), weights.begin(), locations.size());
    typedef boost::property_map<Graph, boost::vertex_index_t>::type IndexMap;
    IndexMap index = get(boost::vertex_index, g);
    Graph::vertex_iterator v_it, v_end;
    for (boost::tie(v_it, v_end) = vertices(g); v_it != v_end; ++v_it) {
        g[*v_it].lat = locations[index[*v_it]].lat;
        g[*v_it].lon = locations[index[*v_it]].lon;
    }


    utility::string_t address = U("http://localhost:1337");

    RoutesDealer listener(address, g);
    listener.open().wait();

    cout << utility::string_t(U("Listening for requests at localhost "))  << std::endl;

    std::string cline;
    std::wcout << U("Hit Enter to close the listener.");
    std::getline(std::cin, cline);

    listener.close().wait();
}
