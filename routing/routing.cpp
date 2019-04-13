#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_traits.hpp>

#include <string>
#include <vector>
#include <fstream>
#include <iostream>



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

    for (boost::tie(v_it, v_end) = vertices(g); v_it != v_end; ++v_it) {
        cout << "lat is " <<  g[*v_it].lat << ", "  <<
                "lon is " << g[*v_it].lon << endl;
    }
}
