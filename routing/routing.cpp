
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


#include <arlib/esx.hpp>
#include <arlib/graph_utils.hpp>
#include <arlib/multi_predecessor_map.hpp>
#include <arlib/onepass_plus.hpp>
#include <arlib/path.hpp>
#include <arlib/penalty.hpp>
#include <arlib/routing_kernels/types.hpp>


#include <string>
#include <vector>
#include <fstream>
#include <iostream>
#include <cmath>
#include <float.h>

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


long double toRadians(const long double degree){
    long double one_deg = (M_PI) / 180;
    return (one_deg * degree);
}
 //Distance in KMs between two points
long double distance(long double lat1, long double long1,
                     long double lat2, long double long2)
{
    lat1 = toRadians(lat1);
    long1 = toRadians(long1);
    lat2 = toRadians(lat2);
    long2 = toRadians(long2);

    long double dlong = long2 - long1;
    long double dlat = lat2 - lat1;

    long double ans = pow(sin(dlat / 2), 2) +
                      cos(lat1) * cos(lat2) *
                      pow(sin(dlong / 2), 2);

    ans = 2 * asin(sqrt(ans));

    long double R = 6371;

    ans = ans * R;

    return ans;
}

Vertex get_vertex(long double lat1, long double long1,
                  Graph g) {
    auto vs = boost::vertices(g);
    double min = DBL_MAX;
    Vertex min_vertex;
    for (auto vit = vs.first; vit!= vs.second; vit++) {
        long double curr = distance(lat1, long1, g[*vit].lat, g[*vit].lon);
        if (curr == 0)
            return *vit;
        else if (curr < min)
            min_vertex = *vit;
    }
    return min_vertex;
}

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


// Get paths made by (lat,lon) point in vector using Penalty
template<typename Graph>
vector<vector<Location>> get_alternative_routes(Graph const &g, Vertex s,
                                                  Vertex t, int k, double theta,
                                                  int max_nb_updates = 10, int max_nb_steps = 100000) {

    using namespace boost;
    using arlib::routing_kernels;
    auto weight = boost::get(boost::edge_weight, g);
    auto predecessors = arlib::multi_predecessor_map<Vertex>{};
    vector<vector<Location>> location_paths;

    penalty(g, weight, predecessors, s, t, k, theta,  100, 100, max_nb_updates, max_nb_steps,
            routing_kernels::bidirectional_dijkstra);
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
    Graph g;
    http_listener m_listener;
};


RoutesDealer::RoutesDealer(utility::string_t url, Graph g) : m_listener(url)
{

    m_listener.support(methods::GET, std::bind(&RoutesDealer::handle_get, this, std::placeholders::_1));
    this->g = g;
}


void RoutesDealer::handle_get(http_request message)
{
    message.reply(status_codes::OK);
    value geojson = value::object();
    try {
        double lat, lon;
        auto url_message= uri::decode(message.relative_uri().to_string());
        url_message.erase(0,2);
        map<utility::string_t, utility::string_t> keyMap = uri::split_query(url_message);
        if (keyMap.find("s_lat") != keyMap.end()) {
            lat = stod(keyMap["s_lat"]);
        } else message.reply(status_codes::BadRequest);
        if (keyMap.find("s_lon") != keyMap.end()) {
            lon = stod(keyMap["s_lon"]);
        } else message.reply(status_codes::BadRequest);
       Vertex start = get_vertex(lat,lon,g);
        if (keyMap.find("e_lat") != keyMap.end()) {
            lat = stod(keyMap["e_lat"]);
        } else message.reply(status_codes::BadRequest);
        if (keyMap.find("e_lon") != keyMap.end()) {
            lon = stod(keyMap["e_lon"]);
        } else message.reply(status_codes::BadRequest);
        Vertex end = get_vertex(lat,lon, g);
        int a = 1;
        vector<vector<Location>> paths = get_alternative_routes(g, start, end, 1, 0.9);
        auto es = boost::edges(g);
        for (auto eit = es.first; eit != es.second; ++eit) {
            cout << get(boost::edge_weight_t(), g, *eit) << endl;
        }
        cout << endl;
    } catch (...) {
        message.reply(status_codes::BadRequest);
    }
}



using Graph = boost::adjacency_list<boost::vecS, boost::vecS,
                                    boost::bidirectionalS, Location,
                                    boost::property<boost::edge_weight_t, int>>;
using Vertex = typename boost::graph_traits<Graph>::vertex_descriptor;
using Edge = typename boost::graph_traits<Graph>::edge_descriptor;


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


    utility::string_t address = U("http://localhost:1337/routes?");

    RoutesDealer listener(address, g);
    listener.open().wait();

    cout << utility::string_t(U("Listening for requests at localhost "))  << std::endl;

    std::string cline;
    std::wcout << U("Hit Enter to close the listener.");
    std::getline(std::cin, cline);

    listener.close().wait();
}
