#!/usr/bin/env python3
import argparse
import json


out = {
    'type': 'FeatureCollection',
    'features': []
}


def gen_rect(t, b, l, r):
    """
    :param t: top latitude
    :param b: bottom latitude
    :param l: left longitude
    :param r: right longitude
    :return: GeoJSON rect with specified borders
    """
    ret = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'Polygon',
            'coordinates': [[[l, t], [r, t], [r, b], [l, b], [l, t]]]
        }
    }
    return ret


def split_range(minimum, maximum, parts):
    """
    :param minimum: lower bound
    :param maximum: upper bound
    :param parts: number of points to generate
    :return: list of parts equidistant points between minimum and maximum (included)
    """
    if parts == 1:
        return [minimum, maximum]
    else:
        return [minimum + (maximum - minimum) * i / (parts-1) for i in range(parts)]


def main():
    # Bounding box of Milan
    default_bbox = {
        "top": 45.555946,
        "bottom": 45.366724,
        "left": 9.020613,
        "right": 9.2979979
    }
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', action='store', dest='order',
                        help='Size of grid', default="2")
    parser.add_argument('-f', action='store', dest='bboxfile',
                        help='File path of the JSON bounding box', default=None)
    args = parser.parse_args()
    order = int(args.order)
    if args.bboxfile is None:
        bbox = default_bbox
    else:
        with open(args.bboxfile, 'r') as fp:
            bbox = json.load(fp)

    lats = split_range(bbox['top'], bbox['bottom'], order+1)
    lngs = split_range(bbox['left'], bbox['right'], order+1)
    for i in range(order):
        for j in range(order):
            out['features'].append(gen_rect(lats[i], lats[i + 1], lngs[j], lngs[j + 1]))

    print(json.dumps(out))


if __name__ == '__main__':
    main()
