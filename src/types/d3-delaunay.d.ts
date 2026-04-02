declare module 'd3-delaunay' {
  type Point2D = readonly [number, number];

  export class Delaunay {
    static from(points: ReadonlyArray<Point2D>): Delaunay;

    voronoi(bounds: [number, number, number, number]): {
      cellPolygon(index: number): Array<Point2D> | null;
    };
  }
}
