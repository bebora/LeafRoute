# Folder content
## csvgen.py
Usage: `./csvgen.py [N]`  
Result: NxN random csv matrix for source/destination distribution  
## gridgeojson.py
Usage: `./gridgeojson.py [-n ORDER] [-f bounding_box.json]`  
Result: GeoJSON of ORDERxORDER boxes in provided bounding box
## osmprovider.py
Extract ids and weights from OpenStreetMap data  
Usage: `./gridgeojson.py [-f bounding_box.json]`  
Result:
- ids file in /tmp/ids . A list of coordinates (`lon lat`)
- weights file in /tmp/weights . A list of links between coordinates (`source_index destination_index time`, where indices are line number in `ids` file (starting from 0) and time is the estimated time in seconds between the two points)
