# GeoJSONPlanet
JavaScript tool for drawing arbitrary GeoJSON data on the spherical planet model.
Requires a [ThreeJS 3D library](http://threejs.org/) for its work.

## Synopsis

### Constructor

```javascript
GeoJSONPlanet( texture, canvasDOMId, opts ),
```

`texture` is some image, it is assumed that it is a map of the planet
    in a equirectangular projection; texture will be superimposed on the sphere surface.

Here are all current possible members of `opts` object.

`width` : width of canvas (default: `canvas.clientWidth`),
`height`: height of canvas (default: `canvas.clientHeights`),
`background` : background color (default: `‘0x000000’`),
`enableZoom` : enable a user to zoom camera (default: `true`),
`cam.fov` : camera field of view (default: `42`),
`cam.near` : camera near limiter (default: `0.1`),
`cam.far` : camera far limiter (default: `2.7`),
`cam.zPos` : camera z position (default: `3`),
`sphereWidthSegs` : SphereGeometry widthSegments parameter (default: `80`),
`sphereHeightSegs` : SphereGeometry heightSegments parameter (default: `60`),
`oceanColor` : color of the ocean sphere (default: `‘0xaaaaaa’`),
`textureFilter` : minFilter value for the planet sphere texture
(default: `THREE.NearestMipmapNearestFilter`),
`axisColor` : color of the rotation axis (default: `‘0xffffff’`),
`axisAngle` : angle of the rotation axis (default: `0`,
currently angle can be only in XY plane),
`dMin` : minimum distance (grad) between nodes of various string
dependent geometries; if specified then the special precedure supplements
strings with additional nodes (default: `null`),
`dFuncN` : if `dMin` is specified the special function can provide additional
nodes; that function uses method specified by `dFuncN` option
for defining distance between two points on the sphere
(1: the fastest, but inaccurate; 2: more slowly, but accurate for close points; 3: exact, but the slowest;
default: mixed approach).

### Methods

```javascript
rotate(speed).
```
Make the planet model rotating around axis with `speed`.


```javascript
control(speed).
```
Let a user to rotate the planet model with `speed`.


```javascript
drawGeoJSON(geojson, subsFtOptsArr).
```
Draw GeoJSON data with a drawing style specified with `subsFtOptsArr`.

### Styles

`subsFtOptsArr` defines Material and Geometry properties (*styles*) which are used
    while ThreeJS draws corresponding geospatial features.

Example:
```javascript
const subsFtOptsArr = [
{
  'Polygon': {"linewidth" : 1, 'color': '0x2550b9'},
  'MultiPolygon': {"linewidth" : 1, 'color': '0x2550b9'}
},
{
  'Point': {"radius" : 0.02, 'color': '0xf00000'},
  'MultiPoint': {"radius" : 0.02, 'color': '0x2f0000'},
  'LineString': {"linewidth" : 1, 'color': '0xf0f000'},
  'MultiLineString': {"linewidth" : 1, 'color': '0xf0f000'},
  'Polygon': {"linewidth" : 1, 'color': '0xaaa9a0', "dashSize": 0.02, "gapSize": 0.03},
  'MultiPolygon': {"linewidth" : 1, 'color': '0xaaa9a0', "dashSize": 0.02, "gapSize": 0.03}
}
];
```

Alternative or complementary approach involves setting the *style* directly
in the json structure for each *Feature*.

Example:
```javascript
{
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [112.0, 30.5]
        },
        "properties": {
            "threeJSOpts": [{
                "color": "0x44aa00",
                "radius" : 0.01
            }]
        }
    }, {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [100.0,10.0],
                [105.0,27.0],
                [123.0,35.0]
            ]
        },
        "properties": {
            "prop0": "value0",
            "threeJSOpts": [{
                "linewidth": 1
            }]
        }
    }]
}
```

See [the tutorial](http://forgedmaps.com/tutorials/creating-planet-model-with-geojsonplanet/) for more information.

