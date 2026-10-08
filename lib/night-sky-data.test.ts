import { describe, expect, it } from '@jest/globals';
import {
  STAR_LAYERS,
  WEBGPU_STAR_COUNT_SCALE,
  starLayersForBackend,
} from './night-sky-data';

describe('starLayersForBackend', () => {
  it('keeps the WebGL counts, sizes, and brightness', () => {
    const layers = starLayersForBackend('webgl');
    expect(layers).toBe(STAR_LAYERS);
    expect(layers.map(layer => layer.count)).toEqual([10410, 6000, 2400, 201]);
  });

  it('scales only the WebGPU count by about 1.5', () => {
    const layers = starLayersForBackend('webgpu');
    const original = STAR_LAYERS.reduce((sum, layer) => sum + layer.count, 0);
    const scaled = layers.reduce((sum, layer) => sum + layer.count, 0);

    expect(scaled / original).toBeCloseTo(WEBGPU_STAR_COUNT_SCALE, 2);
    layers.forEach((layer, index) => {
      const source = STAR_LAYERS[index];
      expect(layer.count).toBe(
        Math.round(source.count * WEBGPU_STAR_COUNT_SCALE)
      );
      expect(layer.sizeMin).toBe(source.sizeMin);
      expect(layer.sizeMax).toBe(source.sizeMax);
      expect(layer.brightnessMin).toBe(source.brightnessMin);
      expect(layer.brightnessMax).toBe(source.brightnessMax);
      expect(layer.twinkleAmp).toBe(source.twinkleAmp);
      expect(layer.parallax).toBe(source.parallax);
    });
  });
});
