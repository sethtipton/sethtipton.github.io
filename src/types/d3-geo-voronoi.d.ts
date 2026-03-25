declare module 'd3-geo-voronoi' {
  type GeoVoronoiFeature = {
    geometry: {
      coordinates: number[][][];
      type: 'Polygon';
    };
    properties: {
      neighbours: number[];
      site: [number, number];
      sitecoordinates: [number, number];
    };
    type: 'Feature';
  };

  type GeoVoronoiFeatureCollection = {
    features: GeoVoronoiFeature[];
    type: 'FeatureCollection';
  };

  export function geoVoronoi(points: [number, number][]): {
    polygons: () => GeoVoronoiFeatureCollection;
  };
}
