const CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];

export type PointQuadInput = {
  positions: Float32Array;
  colors?: Float32Array;
  sizes?: Float32Array;
  twinkles?: Float32Array;
};

export type PointQuadGeometry = {
  centers: Float32Array;
  corners: Float32Array;
  colors?: Float32Array;
  sizes?: Float32Array;
  twinkles?: Float32Array;
};

/**
 * WebGPU point primitives are 1px, so each point becomes two screen-aligned
 * triangles. Corner offsets are -0.5..0.5 and become the point UV.
 */
export function expandPointQuads(input: PointQuadInput): PointQuadGeometry {
  const count = input.positions.length / 3;
  const centers = new Float32Array(count * 6 * 3);
  const corners = new Float32Array(count * 6 * 2);
  const colors = input.colors ? new Float32Array(count * 6 * 3) : undefined;
  const sizes = input.sizes ? new Float32Array(count * 6) : undefined;
  const twinkles = input.twinkles ? new Float32Array(count * 6 * 3) : undefined;

  for (let i = 0; i < count; i += 1) {
    const px = input.positions[i * 3];
    const py = input.positions[i * 3 + 1];
    const pz = input.positions[i * 3 + 2];
    for (let v = 0; v < 6; v += 1) {
      const vertex = i * 6 + v;
      centers[vertex * 3] = px;
      centers[vertex * 3 + 1] = py;
      centers[vertex * 3 + 2] = pz;
      corners[vertex * 2] = CORNERS[v][0];
      corners[vertex * 2 + 1] = CORNERS[v][1];
      if (colors && input.colors) {
        colors[vertex * 3] = input.colors[i * 3];
        colors[vertex * 3 + 1] = input.colors[i * 3 + 1];
        colors[vertex * 3 + 2] = input.colors[i * 3 + 2];
      }
      if (sizes && input.sizes) {
        sizes[vertex] = input.sizes[i];
      }
      if (twinkles && input.twinkles) {
        twinkles[vertex * 3] = input.twinkles[i * 3];
        twinkles[vertex * 3 + 1] = input.twinkles[i * 3 + 1];
        twinkles[vertex * 3 + 2] = input.twinkles[i * 3 + 2];
      }
    }
  }

  return { centers, corners, colors, sizes, twinkles };
}
