import { Vector2, Vector2d } from './Vector2';
import { Vector4 } from './Vector4';

describe('Vector2', () => {
  test('Vector2 is immutable', () => {
    const vec = Vector2.fromCopyArray([0, 3]);
    expect(() => {
      (vec as any).x = 1;
    }).toThrowError();
    expect(() => {
      (vec as any).y = 1;
    }).toThrowError();

    expect(vec.x).toBe(0);
    expect(vec.y).toBe(3);
  });

  describe('Creation methods', () => {
    test('fromCopy2 creates vector with specified components', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
    });

    test('fromCopyArray2 creates vector from 2-element array', () => {
      const vec = Vector2.fromCopyArray2([1, 2]);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
    });

    test('fromCopyArray creates vector from array (takes first 2 elements)', () => {
      const vec = Vector2.fromCopyArray([1, 2, 3, 4, 5]);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
    });

    test('fromCopyVector2 creates copy of another Vector2', () => {
      const original = Vector2.fromCopy2(1, 2);
      const copy = Vector2.fromCopyVector2(original);
      expect(copy.x).toBe(1);
      expect(copy.y).toBe(2);
      expect(copy).not.toBe(original); // Should be different instances
    });

    test('fromCopyVector4 creates Vector2 from Vector4 (takes x, y)', () => {
      const vec4 = Vector4.fromCopy4(1, 2, 3, 4);
      const vec2 = Vector2.fromCopyVector4(vec4);
      expect(vec2.x).toBe(1);
      expect(vec2.y).toBe(2);
    });

    test('zero creates zero vector', () => {
      const vec = Vector2.zero();
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
    });

    test('one creates vector with all components set to 1', () => {
      const vec = Vector2.one();
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(1);
    });

    test('dummy creates empty dummy vector', () => {
      const vec = Vector2.dummy();
      expect(vec.isDummy()).toBe(true);
    });
  });

  describe('GLSL and WGSL string representations', () => {
    test('glslStrAsFloat returns correct GLSL float representation', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.glslStrAsFloat).toBe('vec2(1.0, 2.0)');
    });

    test('glslStrAsInt returns correct GLSL int representation', () => {
      const vec = Vector2.fromCopy2(1.7, 2.3);
      expect(vec.glslStrAsInt).toBe('ivec2(1, 2)');
    });

    test('wgslStrAsFloat returns correct WGSL float representation', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.wgslStrAsFloat).toBe('vec2f(1.0, 2.0)');
    });

    test('wgslStrAsInt returns correct WGSL int representation', () => {
      const vec = Vector2.fromCopy2(1.7, 2.3);
      expect(vec.wgslStrAsInt).toBe('vec2i(1, 2)');
    });
  });

  describe('Basic operations', () => {
    test('at() returns component at specified index', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.at(0)).toBe(1);
      expect(vec.at(1)).toBe(2);
    });

    test('length() calculates vector magnitude correctly', () => {
      const vec = Vector2.fromCopy2(3, 4);
      expect(vec.length()).toBe(5); // 3-4-5 triangle
    });

    test('lengthSquared() calculates squared magnitude correctly', () => {
      const vec = Vector2.fromCopy2(3, 4);
      expect(vec.lengthSquared()).toBe(25); // 3² + 4² = 9 + 16 = 25
    });

    test('lengthTo() calculates distance between vectors', () => {
      const vec1 = Vector2.fromCopy2(0, 0);
      const vec2 = Vector2.fromCopy2(3, 4);
      expect(vec1.lengthTo(vec2)).toBe(5);
    });

    test('dot() calculates dot product correctly', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(3, 4);
      expect(vec1.dot(vec2)).toBe(11); // 1*3 + 2*4 = 3 + 8 = 11
    });
  });

  describe('Static operations', () => {
    test('add() adds two vectors component-wise', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(3, 4);
      const result = Vector2.add(vec1, vec2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    test('subtract() subtracts two vectors component-wise', () => {
      const vec1 = Vector2.fromCopy2(5, 6);
      const vec2 = Vector2.fromCopy2(2, 3);
      const result = Vector2.subtract(vec1, vec2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(3);
    });

    test('multiply() multiplies vector by scalar', () => {
      const vec = Vector2.fromCopy2(1, 2);
      const result = Vector2.multiply(vec, 3);
      expect(result.x).toBe(3);
      expect(result.y).toBe(6);
    });

    test('multiplyVector() multiplies two vectors component-wise', () => {
      const vec1 = Vector2.fromCopy2(2, 3);
      const vec2 = Vector2.fromCopy2(4, 5);
      const result = Vector2.multiplyVector(vec1, vec2);
      expect(result.x).toBe(8);
      expect(result.y).toBe(15);
    });

    test('divide() divides vector by scalar', () => {
      const vec = Vector2.fromCopy2(6, 9);
      const result = Vector2.divide(vec, 3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
    });

    test('divideVector() divides two vectors component-wise', () => {
      const vec1 = Vector2.fromCopy2(10, 20);
      const vec2 = Vector2.fromCopy2(2, 4);
      const result = Vector2.divideVector(vec1, vec2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    test('normalize() creates unit vector', () => {
      const vec = Vector2.fromCopy2(3, 4);
      const normalized = Vector2.normalize(vec);
      expect(normalized.length()).toBeCloseTo(1, 6);
      expect(normalized.x).toBeCloseTo(0.6, 6);
      expect(normalized.y).toBeCloseTo(0.8, 6);
    });

    test('dot() static method calculates dot product correctly', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(3, 4);
      expect(Vector2.dot(vec1, vec2)).toBe(11);
    });

    test('lengthSquared() static method calculates squared length', () => {
      const vec = Vector2.fromCopy2(3, 4);
      expect(Vector2.lengthSquared(vec)).toBe(25);
    });

    test('lengthBtw() calculates distance between vectors', () => {
      const vec1 = Vector2.fromCopy2(0, 0);
      const vec2 = Vector2.fromCopy2(3, 4);
      expect(Vector2.lengthBtw(vec1, vec2)).toBe(5);
    });

    test('angleOfVectors() calculates angle between vectors', () => {
      const vec1 = Vector2.fromCopy2(1, 0);
      const vec2 = Vector2.fromCopy2(0, 1);
      const angle = Vector2.angleOfVectors(vec1, vec2);
      expect(angle).toBeCloseTo(Math.PI / 2, 6); // 90 degrees in radians
    });
  });

  describe('Comparison methods', () => {
    test('isEqual() checks approximate equality with default tolerance', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(1 + Number.EPSILON / 2, 2 + Number.EPSILON / 2);
      expect(vec1.isEqual(vec2)).toBe(true);
    });

    test('isEqual() checks approximate equality with custom tolerance', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(1.1, 2.1);
      expect(vec1.isEqual(vec2, 0.2)).toBe(true);
      expect(vec1.isEqual(vec2, 0.05)).toBe(false);
    });

    test('isStrictEqual() checks exact equality', () => {
      const vec1 = Vector2.fromCopy2(1, 2);
      const vec2 = Vector2.fromCopy2(1, 2);
      const vec3 = Vector2.fromCopy2(1.0000001, 2);
      expect(vec1.isStrictEqual(vec2)).toBe(true);
      expect(vec1.isStrictEqual(vec3)).toBe(false);
    });

    test('isDummy() returns false for normal vectors', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.isDummy()).toBe(false);
    });
  });

  describe('Utility methods', () => {
    test('toString() returns string representation', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.toString()).toBe('(1, 2)');
    });

    test('flattenAsArray() returns array representation', () => {
      const vec = Vector2.fromCopy2(1, 2);
      const array = vec.flattenAsArray();
      expect(array).toEqual([1, 2]);
    });

    test('clone() creates a copy of the vector', () => {
      const vec = Vector2.fromCopy2(1, 2);
      const cloned = vec.clone();
      expect(cloned.x).toBe(1);
      expect(cloned.y).toBe(2);
      expect(cloned).not.toBe(vec);
    });

    test('className returns correct class name', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.className).toBe('Vector2');
    });

    test('bytesPerComponent returns correct byte size', () => {
      const vec = Vector2.fromCopy2(1, 2);
      expect(vec.bytesPerComponent).toBe(4); // Float32Array
    });
  });

  describe('Constants', () => {
    test('compositionType returns Vec2', () => {
      expect(Vector2.compositionType.index).toBe(1); // Vec2 composition type
    });
  });
});

describe('Vector2d (double precision)', () => {
  test('fromCopy2 creates double precision vector', () => {
    const vec = Vector2d.fromCopy2(1.123456789012345, 2.987654321098765);
    expect(vec.x).toBe(1.123456789012345);
    expect(vec.y).toBe(2.987654321098765);
  });

  test('bytesPerComponent returns 8 for double precision', () => {
    const vec = Vector2d.fromCopy2(1, 2);
    expect(vec.bytesPerComponent).toBe(8); // Float64Array
  });

  test('mathematical operations work with double precision', () => {
    const vec1 = Vector2d.fromCopy2(1.1, 2.2);
    const vec2 = Vector2d.fromCopy2(3.3, 4.4);
    const result = Vector2d.add(vec1, vec2);
    expect(result.x).toBeCloseTo(4.4, 10);
    expect(result.y).toBeCloseTo(6.6, 10);
  });

  test('fromArrayBuffer creates vector from ArrayBuffer', () => {
    const buffer = new ArrayBuffer(16); // 2 * 8 bytes for 2 double values
    const view = new Float64Array(buffer);
    view[0] = 1.5;
    view[1] = 2.5;

    const vec = Vector2d.fromArrayBuffer(buffer);
    expect(vec.x).toBe(1.5);
    expect(vec.y).toBe(2.5);
  });

  test('fromFloat64Array creates vector from Float64Array', () => {
    const array = new Float64Array([3.14, 2.71]);
    const vec = Vector2d.fromFloat64Array(array);
    expect(vec.x).toBe(3.14);
    expect(vec.y).toBe(2.71);
  });
});
