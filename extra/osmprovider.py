#!/usr/bin/env python
# -*- coding: utf-8 -*-
__author__ = "Leonardo Arcari @leonardoarcari"
from networkx.relabel import convert_node_labels_to_integers
import networkx as nx

from pathlib import Path
from osgeo import ogr
from osgeo import osr

from math import cos, sin, asin, sqrt, radians
import random

## Modules
# Elementary modules
from math import radians, cos, sin, asin, sqrt
import argparse
import copy
import json
import os

speed_limits = {"motorway"     :130, "trunk"        :110, "primary"       :90,
                    "secondary"    :70, "tertiary"     : 70, "unclassified"  : 30,
                    "residential"  : 50, "service"      : 10, "motorway_link" : 60,
                    "trunk_link"   : 60, "primary_link" : 60, "secondary_link": 60,
                    "tertiary_link": 35, "living_street":  5, "pedestrian"    :  5,
                    "track"        :  5, "road"         :  5, "footway"       :  5,
                    "steps"        :  5, "path"         :  5, "cycleway"      :  5,
                    "it:urban":   50, "it:rural":   90, "it:motorway": 130,
                    "it:trunk": 110}

# Specific modules
import xml.sax # parse osm file
from pathlib import Path # manage cached tiles
banned_tags = [
    "footway",
    "bridleway",
    "steps",
    "path",
    "cycleway",
    "construction"
]

def street_filter(way):
    ht = way.tags["highway"]
    if ht in banned_tags:
        return False
    return True

def haversine(lon1, lat1, lon2, lat2, unit_m = True):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    default unit : km
    """
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    if (unit_m):
        r *= 1000
    return c * r



def download_osm(left, bottom, right, top, proxy = False, proxyHost = "10.0.4.2", proxyPort = "3128", cache = False, cacheTempDir = "/tmp/tmpOSM/", verbose = True):
    """ Return a filehandle to the downloaded data from osm api."""

    import urllib.request # To request the web

    if 'map' in os.listdir('.'):
        print("Assuming ./map is the right file")
        return open('map', 'r')
    if (cache):
        ## cached tile filename
        cachedTileFilename = "osm_map_{:.8f}_{:.8f}_{:.8f}_{:.8f}.map".format(left, bottom, right, top)

        if (verbose):
            print("Cached tile filename :", cachedTileFilename)

        Path(cacheTempDir).mkdir(parents = True, exist_ok = True) ## Create cache path if not exists

        osmFile = Path(cacheTempDir + cachedTileFilename).resolve() ## Replace the relative cache folder path to absolute path

        if osmFile.is_file():
            # download from the cache folder
            if (verbose):
                print("Tile loaded from the cache folder.")

            fp = urllib.request.urlopen("file://"+str(osmFile))
            return fp

    if (proxy):
        # configure the urllib request with the proxy
        proxy_handler = urllib.request.ProxyHandler({'https': 'https://' + proxyHost + ":" + proxyPort, 'http': 'http://' + proxyHost + ":" + proxyPort})
        opener = urllib.request.build_opener(proxy_handler)
        urllib.request.install_opener(opener)


    # request = "http://api.openstreetmap.org/api/0.6/map?bbox=%f,%f,%f,%f"%(left,bottom,right,top)
    # request = "http://overpass.osm.rambler.ru/cgi/xapi_meta?*[bbox=%f,%f,%f,%f]"%(left,bottom,right,top)
    request = "http://www.overpass-api.de/api/xapi_meta?*[bbox=%f,%f,%f,%f]"%(left,bottom,right,top)
    
    if (verbose):
        print("Download the tile from osm web api ... in progress")
        print("Request :", request)

    fp = urllib.request.urlopen(request)

    if (verbose):
        print("OSM Tile downloaded")

    if (cache):
        if (verbose):
            print("Write osm tile in the cache"
            )
        content = fp.read()
        with open(osmFile, 'wb') as f:
            f.write(content)

        if osmFile.is_file():
            if (verbose):
                print("OSM tile written in the cache")

            fp = urllib.request.urlopen("file://"+str(osmFile)) ## Reload the osm tile from the cache (because fp.read moved the cursor)
            return fp

    return fp


def read_osm(filename_or_stream, only_roads=True):
    """Read graph in OSM format from file specified by name or by stream object.
    Parameters
    ----------
    filename_or_stream : filename or stream object

    Returns
    -------
    G : Graph

    Examples
    --------
    >>> G=nx.read_osm(nx.download_osm(-122.33,47.60,-122.31,47.61))
    >>> import matplotlib.pyplot as plt
    >>> plt.plot([G.node[n]['lat']for n in G], [G.node[n]['lon'] for n in G], 'o', color='k')
    >>> plt.show()
    """
    osm = OSM(filename_or_stream)
    G = nx.DiGraph()

    ## Add ways
    for w in osm.ways.values():
        if only_roads and 'highway' not in w.tags:
            continue
        if not street_filter(w):
            continue
        speed = 50
        if 'maxspeed' in w.tags:
            speed = w.tags['maxspeed']
        elif w.tags['highway'] in speed_limits.keys():
            speed = speed_limits[w.tags['highway']]
        if ('oneway' in w.tags):
            if (w.tags['oneway'] == 'yes'):
                # ONLY ONE DIRECTION
                G.add_path(w.nds, id=w.id, speed = speed)
            else:
                # BOTH DIRECTION
                G.add_path(w.nds, id=w.id, speed = speed)
                G.add_path(w.nds[::-1], id=w.id, speed = speed)
        else:
            # BOTH DIRECTION
            G.add_path(w.nds, id=w.id, speed = speed)
            G.add_path(w.nds[::-1], id=w.id, speed = speed)

    ## Complete the used nodes' information
    for n_id in G.nodes():
        n = osm.nodes[n_id]
        G.node[n_id]['lat'] = n.lat
        G.node[n_id]['lon'] = n.lon
        G.node[n_id]['id'] = n.id

    ## Estimate the length of each way
    for u,v,d in G.edges(data=True):
        distance = haversine(G.node[u]['lon'], G.node[u]['lat'], G.node[v]['lon'], G.node[v]['lat'], unit_m = True) # Give a realistic distance estimation (neither EPSG nor projection nor reference system are specified)
        speed = d['speed']
        try:
            time_seconds = distance / (float(speed)*1000) *3600
        except ValueError:
            speed = speed.lower()
            if 'none' in speed:
                speed = 50
            elif 'mph' in speed or 'mp/h' in speed:
                speed = ''.join(c for c in speed if c.isdigit())
                speed = int(float(speed) * 1.609344)
            elif 'kmh' in speed or 'km/h' in speed or 'kph' in speed or 'kp/h' in speed:
                speed = ''.join(c for c in speed if c.isdigit())
            elif speed in speed_limits.keys():
                speed = speed_limits[speed]
            else:
                speed = 50
            speed = int(speed)
            time_seconds = distance / (speed*1000) *3600
        G.add_weighted_edges_from([( u, v, time_seconds)], weight='time')

    return G


class Node:
    def __init__(self, id, lon, lat):
        self.id = id
        self.lon = lon
        self.lat = lat
        self.tags = {}

    def __str__(self):
        return "Node (id : %s) lon : %s, lat : %s "%(self.id, self.lon, self.lat)


class Way:
    def __init__(self, id, osm):
        self.osm = osm
        self.id = id
        self.nds = []
        self.tags = {}

    def split(self, dividers):
        # slice the node-array using this nifty recursive function
        def slice_array(ar, dividers):
            for i in range(1,len(ar)-1):
                if dividers[ar[i]]>1:
                    left = ar[:i+1]
                    right = ar[i:]

                    rightsliced = slice_array(right, dividers)

                    return [left]+rightsliced
            return [ar]

        slices = slice_array(self.nds, dividers)

        # create a way object for each node-array slice
        ret = []
        i=0
        for slice in slices:
            littleway = copy.copy( self )
            littleway.id += "-%d"%i
            littleway.nds = slice
            ret.append( littleway )
            i += 1

        return ret



class OSM:
    def __init__(self, filename_or_stream):
        """ File can be either a filename or stream/file object."""
        nodes = {}
        ways = {}

        superself = self

        class OSMHandler(xml.sax.ContentHandler):
            @classmethod
            def setDocumentLocator(self,loc):
                pass

            @classmethod
            def startDocument(self):
                pass

            @classmethod
            def endDocument(self):
                pass

            @classmethod
            def startElement(self, name, attrs):
                if name=='node':
                    self.currElem = Node(attrs['id'], float(attrs['lon']), float(attrs['lat']))
                elif name=='way':
                    self.currElem = Way(attrs['id'], superself)
                elif name=='tag':
                    self.currElem.tags[attrs['k']] = attrs['v']
                elif name=='nd':
                    self.currElem.nds.append( attrs['ref'] )

            @classmethod
            def endElement(self,name):
                if name=='node':
                    nodes[self.currElem.id] = self.currElem
                elif name=='way':
                    ways[self.currElem.id] = self.currElem

            @classmethod
            def characters(self, chars):
                pass

        xml.sax.parse(filename_or_stream, OSMHandler)

        self.nodes = nodes
        self.ways = ways

        #count times each node is used
        node_histogram = dict.fromkeys( self.nodes.keys(), 0 )
        for way in self.ways.values():
            if len(way.nds) < 2:       #if a way has only one node, delete it out of the osm collection
                del self.ways[way.id]
            else:
                for node in way.nds:
                    node_histogram[node] += 1

        #use that histogram to split all ways, replacing the member set of ways
        new_ways = {}
        for id, way in self.ways.items():
            split_ways = way.split(node_histogram)
            for split_way in split_ways:
                new_ways[split_way.id] = split_way
        self.ways = new_ways


class MapProvider:
    """
    This is an interface for classes providing data about a geographical map.
    A MapProvider offers general-information about the map, conversion between
    source IDs and normalized IDs (i.e. starting from 0). Moreover, it enables
    map serialization to .gr file format.
    """
    def getName(self):
        raise NotImplementedError()

    def getNumVertices(self):
        raise NotImplementedError()
    
    def getNumEdges(self):
        raise NotImplementedError()
    
    def getXRange(self):
        raise NotImplementedError()
    
    def getYRange(self):
        raise NotImplementedError()
    
    def getPoint(self, id, targetEPSG):
        raise NotImplementedError()
    
    def getDistanceKm(self, id1, id2):
        raise NotImplementedError()

    def toID(self, normalized_id):
        raise NotImplementedError()
    
    def toNormalizedID(self, id):
        raise NotImplementedError()
    
    def getNormalizedVertices(self):
        raise NotImplementedError()
    
    def getNormalizedEdges(self):
        raise NotImplementedError()

    def generateRandomP2P(self, n, seed):
        raise NotImplementedError()

    def writeP2P(self, path, p2p_seq):
        raise NotImplementedError()
    
    def write(self, path):
        raise NotImplementedError()
    
    def write_coo(self, path):
        raise NotImplementedError()

    def writeWkt(self, out_path, alt_paths, targetEPSG):
        raise NotImplementedError()


class OSMProvider(MapProvider):
    def __init__(self, name, left, bottom, right, top):
        super().__init__()
        self.name = name
        self.left = left
        self.bottom = bottom
        self.right = right
        self.top = top
        self.srcEPSG = 4326  # WGS84
        self.G = read_osm(download_osm(left, bottom, right, top, cache=True))
        self.G = convert_node_labels_to_integers(self.G, label_attribute='id')

    def getName(self):
        return self.name

    def getNumVertices(self):
        return self.G.number_of_nodes()

    def getNumEdges(self):
        return self.G.number_of_edges()

    def getXRange(self):
        raise NotImplementedError()

    def getYRange(self):
        raise NotImplementedError()

    def getPoint(self, id, targetEPSG):
        lat = self.G.node[id]['lat']
        lon = self.G.node[id]['lon']
        # Load source EPSG reference system
        source = osr.SpatialReference()
        source.ImportFromEPSG(self.srcEPSG)
        # Load target EPSG
        target = osr.SpatialReference()
        target.ImportFromEPSG(targetEPSG)

        # Transform coordinates
        transform = osr.CoordinateTransformation(source, target)
        point = ogr.CreateGeometryFromWkt('POINT ({} {})'.format(lon, lat))
        point.Transform(transform)
        x_prime, y_prime = (point.GetX(), point.GetY())
        return (x_prime, y_prime)

    def getDistanceKm(self, id1, id2):
        WGS84 = 4326
        lon1, lat1 = self.getPoint(id1, WGS84)
        lon2, lat2 = self.getPoint(id2, WGS84)

        return self._calc_distance(lat1, lon1, lat2, lon2)

    def toID(self, normalized_id):
        return normalized_id

    def toNormalizedID(self, id):
        return id

    def getNormalizedVertices(self):
        return self.G.nodes()

    def getNormalizedEdges(self):
        return self.G.edges()

    def generateRandomP2P(self, n=1000, seed=None):
        if seed is not None:
            random.seed(seed)

        def sample_node():
            return random.randrange(self.getNumVertices())

        p2p = [(sample_node(), sample_node()) for _ in range(n)]
        return p2p

    def writeP2P(self, path, p2p_seq):
        p = Path(path)
        print('[OSMProvider] Writing P2P in ARLib-format to {}...'.format(p))
        with open(p, mode='w') as f:
            for s, t in p2p_seq:
                f.write('{} {}\n'.format(s, t))

    def write(self, path):
        p = Path(path)
        print('[OSMProvider] Writing graph in ARLib-format to {}...'.format(p))
        with open(p, mode='w') as f:
            for u, v, w in self.G.edges(data='time'):
                f.write('{} {} {}\n'.format(u, v, w))
    
    def write_coo(self, path):
        p = Path(path)
        WGS84 = 4326
        print('[OSMProvider] Writing coordinates in ARLib-format to {}...'.format(p))
        with open(p, mode='w') as f:
            for v in sorted(nx.nodes(self.G)):
                lon, lat = self.getPoint(v, WGS84)
                f.write('{} {}\n'.format(lon, lat))
    
    def writeWkt(self, out_path, alt_paths, targetEPSG):
        p = Path(out_path)
        print('[OSMProvider] Writing alternative paths in WKT to {}...'.format(p))
        # Fill Multiline
        lines = []
        for alt_path in alt_paths:
            # Fill path Line
            line = ogr.Geometry(ogr.wkbLineString)
            for v in alt_path:
                v = self.toID(v)
                x, y = self.getPoint(v, targetEPSG)
                line.AddPoint(x, y)
            lines.append(line)
        # Write to out_path
        with open(p, mode='w') as f:
            f.write('K;Line\n')
            for k, line in enumerate(lines):
                f.write('{};{}\n'.format(k, line.ExportToWkt()))

    def writeDIMACS(self, path):
        p = Path(path)
        print('[OSMProvider] Writing graph in DIMACS-format to {}...'.format(p))
        with open(p, mode='w') as f:
            header = ['p sp '
                      '{} {}\n'.format(self.getNumVertices(), self.getNumEdges())]
            f.writelines(header)
            for u, v, w in self.G.edges(data='time'):
                f.write('a {} {} {}\n'.format(u, v, w))

    @staticmethod
    def _calc_distance(lat1, lon1, lat2, lon2):
        """
        Calculate the great circle distance between two points
        on the earth (specified in decimal degrees)
        """
        # convert decimal degrees to radians
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        # haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km


if __name__ == "__main__":
    milan = {
        "top": 45.555946,
        "bottom": 45.366724,
        "left": 9.020613,
        "right": 9.2979979
    }
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', action='store', dest='bboxfile',
                        help='File path of the JSON bounding box', default=None)
    args = parser.parse_args()
    if args.bboxfile is None:
        bbox = milan
    else:
        with open(args.bboxfile, 'r') as fp:
            bbox = json.load(fp)
    maps = OSMProvider('Milan', **bbox)
    
    maps.write('/tmp/weights')
    # maps.writeDIMACS('/tmp/milan_map.gr')
    maps.write_coo('/tmp/ids')
    # maps.writeP2P('/tmp/milan.p2p', map.generateRandomP2P(seed=1234))
