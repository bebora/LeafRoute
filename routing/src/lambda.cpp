#include <iostream>
#include <string>
#include <vector>
#include <boost/graph/adjacency_list.hpp>
#include "routesfetcher.h"
#include "../external/json11/json11.hpp"
#include "utils.hpp"
using namespace json11;
using namespace std;
using namespace arlib;
using namespace std;
//TODO add aws lambda cpp

using Graph = boost::adjacency_list<boost::vecS, boost::vecS,
        boost::bidirectionalS, Location,
        boost::property<boost::edge_weight_t, double>>;
using Vertex = typename boost::graph_traits<Graph>::vertex_descriptor;
using Edge = typename boost::graph_traits<Graph>::edge_descriptor;

Graph g;
 /*
  * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
  * API Gateway Input format
  * {
     "resource": "Resource path",
     "path": "Path parameter",
     "httpMethod": "Incoming request's method name"
     "headers": {String containing incoming request headers}
     "multiValueHeaders": {List of strings containing incoming request headers}
     "queryStringParameters": {query string parameters }
     "multiValueQueryStringParameters": {List of query string parameters}
     "pathParameters":  {path parameters}
     "stageVariables": {Applicable stage variables}
     "requestContext": {Request context, including authorizer-returned key-value pairs}
     "body": "A JSON string of the request payload."
     "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"

  * }
  * Only "queryStringParameters" will be used here
  *
  * API Gateway Output format
  * {
    "isBase64Encoded": true|false,
    "statusCode": httpStatusCode,
    "headers": { "headerName": "headerValue", ... },
    "body": "..."
  * }
  */
int main() {
    location_graph_from_string("weights", "ids", g);
    //Dummy request received from AWS API Gateway
    string request = "{\n"
                     "\t\"resource\": \"/getroutes\",\n"
                     "\t\"path\": \"/getroutes\",\n"
                     "\t\"httpMethod\": \"GET\",\n"
                     "\t\"headers\": null,\n"
                     "\t\"multiValueHeaders\": null,\n"
                     "\t\"queryStringParameters\": {\n"
                     "\t\t\"s_lat\": \"45.4667971\",\n"
                     "\t\t\"s_lon\": \"9.1904984\",\n"
                     "\t\t\"e_lat\": \"45.4783918\",\n"
                     "\t\t\"e_lon\": \"9.224554764332705\",\n"
                     "\t\t\"reroute\": \"false\",\n"
                     "\t\t\"n_routes\": \"3\"\n"
                     "\t},\n"
                     "\t\"pathParameters\": null,\n"
                     "\t\"stageVariables\": null,\n"
                     "\t\"requestContext\": {},\n"
                     "\t\"body\": \"\","
                     "\t\"isBase64Encoded\": false"
                     "}";
    string err;
    auto js_obj = Json::parse(request, err);
    auto parameters = js_obj["queryStringParameters"];
    auto s_lat = stof(parameters["s_lat"].string_value());
    auto s_lon = stof(parameters["s_lon"].string_value());
    auto e_lat = stof(parameters["e_lat"].string_value());
    auto e_lon = stof(parameters["e_lon"].string_value());
    bool reroute = parseBoolean(parameters["reroute"].string_value());
    auto num_routes_str = parameters["n_routes"].string_value();
    int num_routes;
    try {
        num_routes = stof(num_routes_str);
    }
    catch (invalid_argument &) {
        num_routes = 2;
    }
    Vertex start;
    get_vertex(s_lat, s_lon, g, start);
    Vertex end;
    get_vertex(e_lat, e_lon, g, end);
    auto paths = get_alternative_routes(g, start, end, num_routes, 0.9, reroute);
    auto headers = Json::object {{"Access-Control-Allow-Origin", "*"}};
    Json response = Json::object{
        {"isBase64Encoded", false},
        {"statusCode", 200},
        {"headers", headers},
        {"body", paths.dump()}
    };
    cout << response.dump() << std::endl;
    return 0;
}
