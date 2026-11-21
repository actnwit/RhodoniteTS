import { convertFloat32ToFloat16Bits } from './convertFloat32ToFloat16Bits';
import { packRgbaRowsForUpload } from './packRgbaRowsForUpload';

test('pads rows to 256 bytes and uses an element stride for Float32', () => {
  const width = 3;
  const height = 3;
  const src = new Float32Array(width * height * 4);
  for (let i = 0; i < src.length; i++) {
    src[i] = i + 1;
  }

  const packed = packRgbaRowsForUpload(src, width, height, false);

  expect(packed.bytesPerRow).toBe(256);
  expect(packed.elementsPerRow).toBe(64);
  expect(packed.data).toBeInstanceOf(Float32Array);
  expect(packed.data.length).toBe(packed.elementsPerRow * height);

  const data = packed.data as Float32Array;
  for (let y = 0; y < height; y++) {
    const sourceRowStart = y * width * 4;
    const destRowStart = y * packed.elementsPerRow;
    for (let x = 0; x < width * 4; x++) {
      expect(data[destRowStart + x]).toBe(src[sourceRowStart + x]);
    }
    // The padding between rows must stay zero.
    for (let x = width * 4; x < packed.elementsPerRow; x++) {
      expect(data[destRowStart + x]).toBe(0);
    }
  }
});

test('packs half floats with the same row layout', () => {
  const width = 4;
  const height = 2;
  const src = new Float32Array(width * height * 4);
  for (let i = 0; i < src.length; i++) {
    src[i] = i * 0.5;
  }

  const packed = packRgbaRowsForUpload(src, width, height, true);

  expect(packed.bytesPerRow).toBe(256);
  expect(packed.elementsPerRow).toBe(128);
  expect(packed.data).toBeInstanceOf(Uint16Array);

  const expected = convertFloat32ToFloat16Bits(src);
  const data = packed.data as Uint16Array;
  for (let y = 0; y < height; y++) {
    const sourceRowStart = y * width * 4;
    const destRowStart = y * packed.elementsPerRow;
    for (let x = 0; x < width * 4; x++) {
      expect(data[destRowStart + x]).toBe(expected[sourceRowStart + x]);
    }
    for (let x = width * 4; x < packed.elementsPerRow; x++) {
      expect(data[destRowStart + x]).toBe(0);
    }
  }
});

test('a row that is already 256-byte aligned needs no padding', () => {
  const width = 16; // 16 texels * 16 bytes = 256 bytes
  const src = new Float32Array(width * 4);
  const packed = packRgbaRowsForUpload(src, width, 1, false);

  expect(packed.bytesPerRow).toBe(256);
  expect(packed.elementsPerRow).toBe(64);
  expect(packed.data.length).toBe(64);
});
