---
date: 2026-09-01
draft: true
slug: downloading-dems
title: Downloading canal digital elevation models (DEMs)
description: A beginner-friendly account of selecting and downloading only the Connecticut and Massachusetts elevation-model tiles near the canal.
---

The Farmington Canal and Hampshire & Hampden Canal run for 86 miles through two states. Downloading every statewide Lidar file would be wasteful, so I selected only the digital elevation model (DEM) tiles near the canal.

The result was **420 files totaling about 4 GB**: 267 from Connecticut and 153 from Massachusetts.

## Select a corridor

I combined the canal and feeder centerlines, then added a 300-meter buffer on each side. This creates a roughly 600-meter-wide corridor—enough terrain to show cuts, embankments, drainage, and lock approaches without downloading large unrelated areas.

Do not buffer longitude and latitude coordinates directly. Degrees are not consistent ground units. Reproject the canal line into each state's projected coordinate system first:

- Connecticut: EPSG:6433
- Massachusetts: EPSG:26986

The selection step performs those transformations and intersects the buffered canal with the available DEM tiles:

```bash
python3 scripts/01_select_tiles.py
```

It writes two download lists and `coverage.geojson`. I open the coverage file in QGIS before downloading anything. A map makes projection errors, gaps, and unrelated tiles easy to spot.

## Connecticut

The project uses NOAA's metric copy of the **CT ECO 2023 statewide DEM**: public 0.5-meter Cloud-Optimized GeoTIFFs.

There is no separate tile index in this workflow. Each filename encodes the State Plane location of a 2,500-foot tile. The selection process:

1. Lists the GeoTIFFs in NOAA's public bucket.
2. Decodes a footprint from each filename.
3. Converts the filename grid from U.S. survey feet to meters.
4. Keeps footprints intersecting the canal buffer.

Two catches matter:

- Abbreviated Connecticut eastings wrap after one million feet. The missing component must be restored or the footprints will be misplaced.
- CT ECO's native files use U.S. survey feet, while NOAA's copy is metric. Check which version you downloaded.

Inspect a sample before processing hundreds of files:

```bash
gdalinfo path/to/connecticut-tile.tif
```

Connecticut also declares a compound horizontal and vertical CRS. A careless reprojection can apply an unwanted vertical transformation and shift elevations by about 30 meters.

## Massachusetts

MassGIS provides `LIDARINDEX_POLY_CURRENT_BEST`, a statewide index shapefile. Each polygon includes a tile name, survey area, and direct `DEM_URL`.

The process is straightforward: transform the canal buffer to EPSG:26986, select intersecting polygons, and save their URLs. The corridor intersects 153 tiles from the 2015 survey: 137 QL1 and 16 QL2.

The main catch is the file format. Massachusetts distributes one-meter ERDAS IMAGINE `.img` rasters compressed with bzip2. The `.bz2` files must be decompressed before QGIS or GDAL can read them.

## State differences

| | Connecticut | Massachusetts |
|---|---|---|
| Source | NOAA copy of CT ECO 2023 | MassGIS 2015 |
| Cell size | 0.5 meter | 1 meter |
| Format | GeoTIFF | bzip2-compressed `.img` |
| Tile selection | Decode filenames | Use an index shapefile |
| Main catch | Native and mirrored files use different units | Files require decompression |

Both sources provide NAVD88 elevations in meters as used here, but their CRS metadata differs. Check it before mosaicking or reprojecting.

## Download and verify

After checking `coverage.geojson`, download the saved selections:

```bash
python3 scripts/02_download_dem.py
```

The downloader uses temporary `.part` files, rejects suspiciously small responses, decompresses the Massachusetts files, and skips completed files when rerun.

Before processing the DEMs, verify:

- 267 Connecticut and 153 Massachusetts files are present.
- No `.part` files remain.
- Sample files report the expected CRS, units, and cell size.
- Coverage crosses the state line without a gap.

The key lesson is simple: build a projected buffer, intersect it with each state's tile system, inspect the result in QGIS, and only then download the DEMs.

Source links and the canal line are available on the [Sources page](/sources).
