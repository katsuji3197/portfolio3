export type DnaBuildOptions = {
  radius: number;
  height: number;
  turns: number;
  segmentsPerTurn: number;
  baseEvery: number;
  baseSegmentsPerPair: number;
};

export type DnaMountOptions = DnaBuildOptions & {
  rotationSpeed: number;
  particleSize: number;
  particleColor: string;
  startViewport: { x: number; y: number };
  endViewport: { x: number; y: number };
};

export function buildDnaPositions(options: DnaBuildOptions): Float32Array {
  const {
    radius,
    height,
    turns,
    segmentsPerTurn,
    baseEvery,
    baseSegmentsPerPair,
  } = options;
  const totalSegments = Math.max(4, Math.floor(turns * segmentsPerTurn));
  const totalAngle = turns * Math.PI * 2;
  const yStart = -height / 2;
  const yStep = height / totalSegments;

  const helixPointsCount = (totalSegments + 1) * 2;
  const pairCount = Math.floor(totalSegments / Math.max(1, baseEvery));
  const baseDotsPerPair = Math.max(1, Math.floor(baseSegmentsPerPair));
  const pairDotsCount = pairCount * (baseDotsPerPair + 1);
  const totalDots = helixPointsCount + pairDotsCount;

  const positions = new Float32Array(totalDots * 3);
  let ptr = 0;

  const getBackbonePos = (i: number) => {
    const t = (i / totalSegments) * totalAngle;
    const y = yStart + i * yStep;
    const ax = radius * Math.cos(t);
    const az = radius * Math.sin(t);
    const bx = radius * Math.cos(t + Math.PI);
    const bz = radius * Math.sin(t + Math.PI);
    return { y, ax, az, bx, bz };
  };

  for (let i = 0; i <= totalSegments; i += 1) {
    const { y, ax, az, bx, bz } = getBackbonePos(i);
    positions[ptr++] = ax;
    positions[ptr++] = y;
    positions[ptr++] = az;
    positions[ptr++] = bx;
    positions[ptr++] = y;
    positions[ptr++] = bz;
  }

  for (let i = 0; i < totalSegments; i += baseEvery) {
    const { y, ax, az, bx, bz } = getBackbonePos(i);
    for (let s = 0; s <= baseDotsPerPair; s += 1) {
      const t = s / (baseDotsPerPair || 1);
      positions[ptr++] = ax + (bx - ax) * t;
      positions[ptr++] = y;
      positions[ptr++] = az + (bz - az) * t;
    }
  }

  return positions;
}
