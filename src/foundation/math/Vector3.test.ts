import { Vector3, Vector3d } from './Vector3';
import { Vector4 } from './Vector4';
import { Matrix44 } from './Matrix44';
import { Quaternion } from './Quaternion';

describe('Vector3', () => {
  test('Vector3 is immutable', () => {
    const vec = Vector3.fromCopyArray([0, 3, 4]);
    expect(() => {
      (vec as any).x = 1;
    }).toThrowError();
    expect(() => {
      (vec as any).y = 1;
    }).toThrowError();
    expect(() => {
      (vec as any).z = 1;
    }).toThrowError();

    expect(vec.x).toBe(0);
    expect(vec.y).toBe(3);
    expect(vec.z).toBe(4);
  });

  test('Vector3.w returns 1 for homogeneous coordinates', () => {
    const vec = Vector3.fromCopy3(1, 2, 3);
    expect(vec.w).toBe(1);
  });

  describe('Creation methods', () => {
    test('fromCopy3 creates vector with specified components', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    test('fromCopyArray3 creates vector from 3-element array', () => {
      const vec = Vector3.fromCopyArray3([1, 2, 3]);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    test('fromCopyArray creates vector from array (takes first 3 elements)', () => {
      const vec = Vector3.fromCopyArray([1, 2, 3, 4, 5]);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    test('fromCopy1 creates vector with all components set to same value', () => {
      const vec = Vector3.fromCopy1(5);
      expect(vec.x).toBe(5);
      expect(vec.y).toBe(5);
      expect(vec.z).toBe(5);
    });

    test('fromCopyVector3 creates copy of another Vector3', () => {
      const original = Vector3.fromCopy3(1, 2, 3);
      const copy = Vector3.fromCopyVector3(original);
      expect(copy.x).toBe(1);
      expect(copy.y).toBe(2);
      expect(copy.z).toBe(3);
      expect(copy).not.toBe(original); // Should be different instances
    });

    test('fromCopyVector4 creates Vector3 from Vector4 (drops w)', () => {
      const vec4 = Vector4.fromCopy4(1, 2, 3, 4);
      const vec3 = Vector3.fromCopyVector4(vec4);
      expect(vec3.x).toBe(1);
      expect(vec3.y).toBe(2);
      expect(vec3.z).toBe(3);
    });

    test('fromFloat32Array creates vector from Float32Array', () => {
      const array = new Float32Array([1, 2, 3]);
      const vec = Vector3.fromFloat32Array(array);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    test('fromCopyFloat32Array creates copy from Float32Array', () => {
      const array = new Float32Array([1, 2, 3]);
      const vec = Vector3.fromCopyFloat32Array(array);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
      // Modify original array to ensure it's a copy
      array[0] = 10;
      expect(vec.x).toBe(1); // Should remain unchanged
    });

    test('zero creates zero vector', () => {
      const vec = Vector3.zero();
      expect(vec.x).toBe(0);
      expect(vec.y).toBe(0);
      expect(vec.z).toBe(0);
    });

    test('one creates vector with all components set to 1', () => {
      const vec = Vector3.one();
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(1);
      expect(vec.z).toBe(1);
    });

    test('dummy creates empty dummy vector', () => {
      const vec = Vector3.dummy();
      expect(vec.isDummy()).toBe(true);
    });
  });

  describe('GLSL and WGSL string representations', () => {
    test('glslStrAsFloat returns correct GLSL float representation', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.glslStrAsFloat).toBe('vec3(1.0, 2.0, 3.0)');
    });

    test('glslStrAsInt returns correct GLSL int representation', () => {
      const vec = Vector3.fromCopy3(1.7, 2.3, 3.9);
      expect(vec.glslStrAsInt).toBe('ivec3(1, 2, 3)');
    });

    test('wgslStrAsFloat returns correct WGSL float representation', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.wgslStrAsFloat).toBe('vec3f(1.0, 2.0, 3.0)');
    });

    test('wgslStrAsInt returns correct WGSL int representation', () => {
      const vec = Vector3.fromCopy3(1.7, 2.3, 3.9);
      expect(vec.wgslStrAsInt).toBe('vec3i(1, 2, 3)');
    });
  });

  describe('Basic operations', () => {
    test('at() returns component at specified index', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.at(0)).toBe(1);
      expect(vec.at(1)).toBe(2);
      expect(vec.at(2)).toBe(3);
    });

    test('length() calculates vector magnitude correctly', () => {
      const vec = Vector3.fromCopy3(3, 4, 0);
      expect(vec.length()).toBe(5); // 3-4-5 triangle
    });

    test('lengthSquared() calculates squared magnitude correctly', () => {
      const vec = Vector3.fromCopy3(3, 4, 0);
      expect(vec.lengthSquared()).toBe(25); // 3² + 4² + 0² = 9 + 16 + 0 = 25
    });

    test('lengthTo() calculates distance between vectors', () => {
      const vec1 = Vector3.fromCopy3(0, 0, 0);
      const vec2 = Vector3.fromCopy3(3, 4, 0);
      expect(vec1.lengthTo(vec2)).toBe(5);
    });

    test('dot() calculates dot product correctly', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(4, 5, 6);
      expect(vec1.dot(vec2)).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    });
  });

  describe('Static operations', () => {
    test('add() adds two vectors component-wise', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(4, 5, 6);
      const result = Vector3.add(vec1, vec2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
      expect(result.z).toBe(9);
    });

    test('subtract() subtracts two vectors component-wise', () => {
      const vec1 = Vector3.fromCopy3(4, 5, 6);
      const vec2 = Vector3.fromCopy3(1, 2, 3);
      const result = Vector3.subtract(vec1, vec2);
      expect(result.x).toBe(3);
      expect(result.y).toBe(3);
      expect(result.z).toBe(3);
    });

    test('multiply() multiplies vector by scalar', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      const result = Vector3.multiply(vec, 2);
      expect(result.x).toBe(2);
      expect(result.y).toBe(4);
      expect(result.z).toBe(6);
    });

    test('multiplyVector() multiplies two vectors component-wise', () => {
      const vec1 = Vector3.fromCopy3(2, 3, 4);
      const vec2 = Vector3.fromCopy3(5, 6, 7);
      const result = Vector3.multiplyVector(vec1, vec2);
      expect(result.x).toBe(10);
      expect(result.y).toBe(18);
      expect(result.z).toBe(28);
    });

    test('divide() divides vector by scalar', () => {
      const vec = Vector3.fromCopy3(6, 9, 12);
      const result = Vector3.divide(vec, 3);
      expect(result.x).toBe(2);
      expect(result.y).toBe(3);
      expect(result.z).toBe(4);
    });

    test('divideVector() divides two vectors component-wise', () => {
      const vec1 = Vector3.fromCopy3(10, 20, 30);
      const vec2 = Vector3.fromCopy3(2, 4, 5);
      const result = Vector3.divideVector(vec1, vec2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
      expect(result.z).toBe(6);
    });

    test('normalize() creates unit vector', () => {
      const vec = Vector3.fromCopy3(3, 4, 0);
      const normalized = Vector3.normalize(vec);
      expect(normalized.length()).toBeCloseTo(1, 6);
      expect(normalized.x).toBeCloseTo(0.6, 6);
      expect(normalized.y).toBeCloseTo(0.8, 6);
      expect(normalized.z).toBeCloseTo(0, 6);
    });

    test('cross() calculates cross product correctly', () => {
      const vec1 = Vector3.fromCopy3(1, 0, 0);
      const vec2 = Vector3.fromCopy3(0, 1, 0);
      const result = Vector3.cross(vec1, vec2);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(1);
    });

    test('dot() static method calculates dot product correctly', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(4, 5, 6);
      expect(Vector3.dot(vec1, vec2)).toBe(32);
    });

    test('lengthSquared() static method calculates squared length', () => {
      const vec = Vector3.fromCopy3(3, 4, 0);
      expect(Vector3.lengthSquared(vec)).toBe(25);
    });

    test('lengthBtw() calculates distance between vectors', () => {
      const vec1 = Vector3.fromCopy3(0, 0, 0);
      const vec2 = Vector3.fromCopy3(3, 4, 0);
      expect(Vector3.lengthBtw(vec1, vec2)).toBe(5);
    });

    test('angleOfVectors() calculates angle between vectors', () => {
      const vec1 = Vector3.fromCopy3(1, 0, 0);
      const vec2 = Vector3.fromCopy3(0, 1, 0);
      const angle = Vector3.angleOfVectors(vec1, vec2);
      expect(angle).toBeCloseTo(Math.PI / 2, 6); // 90 degrees in radians
    });

    test('lerp() performs linear interpolation', () => {
      const vec1 = Vector3.fromCopy3(0, 0, 0);
      const vec2 = Vector3.fromCopy3(10, 20, 30);
      const result = Vector3.lerp(vec1, vec2, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
      expect(result.z).toBe(15);
    });
  });

  describe('Matrix transformation', () => {
    test('multiplyMatrix4() transforms vector by 4x4 matrix', () => {
      const vec = Vector3.fromCopy3(1, 0, 0);
      const translationMatrix = Matrix44.translate(Vector3.fromCopy3(5, 0, 0));
      const result = Vector3.multiplyMatrix4(vec, translationMatrix);
      expect(result.x).toBeCloseTo(6, 6); // 1 + 5 = 6
      expect(result.y).toBeCloseTo(0, 6);
      expect(result.z).toBeCloseTo(0, 6);
    });
  });

  describe('Quaternion transformation', () => {
    test('multiplyQuaternion() transforms vector by quaternion', () => {
      const vec = Vector3.fromCopy3(1, 0, 0);
      const quat = Quaternion.fromAxisAngle(Vector3.fromCopy3(0, 0, 1), Math.PI / 2);
      const result = Vector3.multiplyQuaternion(quat, vec);
      expect(result.x).toBeCloseTo(0, 6);
      expect(result.y).toBeCloseTo(1, 6);
      expect(result.z).toBeCloseTo(0, 6);
    });
  });

  describe('Comparison methods', () => {
    test('isEqual() checks approximate equality with default tolerance', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(1 + Number.EPSILON / 2, 2 + Number.EPSILON / 2, 3 + Number.EPSILON / 2);
      expect(vec1.isEqual(vec2)).toBe(true);
    });

    test('isEqual() checks approximate equality with custom tolerance', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(1.1, 2.1, 3.1);
      expect(vec1.isEqual(vec2, 0.2)).toBe(true);
      expect(vec1.isEqual(vec2, 0.05)).toBe(false);
    });

    test('isStrictEqual() checks exact equality', () => {
      const vec1 = Vector3.fromCopy3(1, 2, 3);
      const vec2 = Vector3.fromCopy3(1, 2, 3);
      const vec3 = Vector3.fromCopy3(1.0000001, 2, 3);
      expect(vec1.isStrictEqual(vec2)).toBe(true);
      expect(vec1.isStrictEqual(vec3)).toBe(false);
    });

    test('isDummy() returns false for normal vectors', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.isDummy()).toBe(false);
    });
  });

  describe('Utility methods', () => {
    test('toString() returns string representation', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.toString()).toBe('(1, 2, 3)');
    });

    test('flattenAsArray() returns array representation', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      const array = vec.flattenAsArray();
      expect(array).toEqual([1, 2, 3]);
    });

    test('clone() creates a copy of the vector', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      const cloned = vec.clone();
      expect(cloned.x).toBe(1);
      expect(cloned.y).toBe(2);
      expect(cloned.z).toBe(3);
      expect(cloned).not.toBe(vec);
    });

    test('className returns correct class name', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.className).toBe('Vector3');
    });

    test('bytesPerComponent returns correct byte size', () => {
      const vec = Vector3.fromCopy3(1, 2, 3);
      expect(vec.bytesPerComponent).toBe(4); // Float32Array
    });
  });

  describe('Constants', () => {
    test('compositionType returns Vec3', () => {
      expect(Vector3.compositionType.index).toBe(2); // Vec3 composition type
    });
  });
});

describe('Vector3d (double precision)', () => {
  test('fromCopy3 creates double precision vector', () => {
    const vec = Vector3d.fromCopy3(1.123456789012345, 2.987654321098765, 3.456789012345678);
    expect(vec.x).toBe(1.123456789012345);
    expect(vec.y).toBe(2.987654321098765);
    expect(vec.z).toBe(3.456789012345678);
  });

  test('bytesPerComponent returns 8 for double precision', () => {
    const vec = Vector3d.fromCopy3(1, 2, 3);
    expect(vec.bytesPerComponent).toBe(8); // Float64Array
  });

  test('mathematical operations work with double precision', () => {
    const vec1 = Vector3d.fromCopy3(1.1, 2.2, 3.3);
    const vec2 = Vector3d.fromCopy3(4.4, 5.5, 6.6);
    const result = Vector3d.add(vec1, vec2);
    expect(result.x).toBeCloseTo(5.5, 10);
    expect(result.y).toBeCloseTo(7.7, 10);
    expect(result.z).toBeCloseTo(9.9, 10);
  });
});