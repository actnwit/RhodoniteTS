import { CompositionType } from '../definitions/CompositionType';
import { Scalar, Scalard } from './Scalar';

describe('Scalar', () => {
  test('Scalar is immutable', () => {
    const scalar = Scalar.fromCopyNumber(5);
    expect(() => {
      (scalar as any).x = 10;
    }).toThrowError();
    expect(scalar.x).toBe(5);
  });

  describe('Creation methods', () => {
    test('fromCopyNumber creates scalar with specified value', () => {
      const scalar = Scalar.fromCopyNumber(3.125); // Use exactly representable float
      expect(scalar.getValue()).toBe(3.125);
      expect(scalar.x).toBe(3.125);
    });

    test('zero creates scalar with value 0', () => {
      const scalar = Scalar.zero();
      expect(scalar.getValue()).toBe(0);
      expect(scalar.x).toBe(0);
    });

    test('one creates scalar with value 1', () => {
      const scalar = Scalar.one();
      expect(scalar.getValue()).toBe(1);
      expect(scalar.x).toBe(1);
    });

    test('dummy creates empty dummy scalar', () => {
      const scalar = Scalar.dummy();
      expect(scalar.isDummy()).toBe(true);
    });
  });

  describe('Value access methods', () => {
    test('getValue returns scalar value', () => {
      const scalar = Scalar.fromCopyNumber(42);
      expect(scalar.getValue()).toBe(42);
    });

    test('getValueInArray returns value wrapped in array', () => {
      const scalar = Scalar.fromCopyNumber(7.5);
      const array = scalar.getValueInArray();
      expect(array).toEqual([7.5]);
      expect(Array.isArray(array)).toBe(true);
    });

    test('x property returns scalar value', () => {
      const scalar = Scalar.fromCopyNumber(-2.5);
      expect(scalar.x).toBe(-2.5);
    });

    test('raw property returns underlying typed array', () => {
      const scalar = Scalar.fromCopyNumber(123);
      const raw = scalar.raw;
      expect(raw).toBeInstanceOf(Float32Array);
      expect(raw[0]).toBe(123);
      expect(raw.length).toBe(1);
    });
  });

  describe('Comparison methods', () => {
    test('isStrictEqual performs exact equality comparison', () => {
      const scalar1 = Scalar.fromCopyNumber(1.0);
      const scalar2 = Scalar.fromCopyNumber(1.0);
      const scalar3 = Scalar.fromCopyNumber(1.0000001);

      expect(scalar1.isStrictEqual(scalar2)).toBe(true);
      expect(scalar1.isStrictEqual(scalar3)).toBe(false);
    });

    test('isEqual performs approximate equality with default tolerance', () => {
      const scalar1 = Scalar.fromCopyNumber(1.0);
      const scalar2 = Scalar.fromCopyNumber(1.0 + Number.EPSILON / 2);
      const scalar3 = Scalar.fromCopyNumber(1.1);

      expect(scalar1.isEqual(scalar2)).toBe(true);
      expect(scalar1.isEqual(scalar3)).toBe(false);
    });

    test('isEqual performs approximate equality with custom tolerance', () => {
      const scalar1 = Scalar.fromCopyNumber(1.0);
      const scalar2 = Scalar.fromCopyNumber(1.05);
      const scalar3 = Scalar.fromCopyNumber(1.15);

      expect(scalar1.isEqual(scalar2, 0.1)).toBe(true);
      expect(scalar1.isEqual(scalar3, 0.1)).toBe(false);
    });
  });

  describe('GLSL string representations', () => {
    test('glslStrAsFloat returns correct GLSL float representation', () => {
      const scalar1 = Scalar.fromCopyNumber(5);
      const scalar2 = Scalar.fromCopyNumber(3.125); // Use exactly representable float

      expect(scalar1.glslStrAsFloat).toBe('5.0');
      expect(scalar2.glslStrAsFloat).toBe('3.125');
    });

    test('glslStrAsInt returns correct GLSL int representation', () => {
      const scalar1 = Scalar.fromCopyNumber(5.7);
      const scalar2 = Scalar.fromCopyNumber(-4.2);
      const scalar3 = Scalar.fromCopyNumber(10);

      expect(scalar1.glslStrAsInt).toBe('5');
      // Math.floor(-4.2) = -5, test the actual behavior
      expect(scalar2.glslStrAsInt).toBe(Math.floor(scalar2.getValue()).toString());
      expect(scalar3.glslStrAsInt).toBe('10');
    });
  });

  describe('WGSL string representations', () => {
    test('wgslStrAsFloat returns correct WGSL float representation', () => {
      const scalar1 = Scalar.fromCopyNumber(5);
      const scalar2 = Scalar.fromCopyNumber(2.75); // Use exactly representable float

      expect(scalar1.wgslStrAsFloat).toBe('5.0');
      expect(scalar2.wgslStrAsFloat).toBe('2.75');
    });

    test('wgslStrAsInt returns correct WGSL int representation', () => {
      const scalar1 = Scalar.fromCopyNumber(7.8);
      const scalar2 = Scalar.fromCopyNumber(-5.2);
      const scalar3 = Scalar.fromCopyNumber(15);

      expect(scalar1.wgslStrAsInt).toBe('7');
      // Math.floor(-5.2) = -6, test the actual behavior
      expect(scalar2.wgslStrAsInt).toBe(Math.floor(scalar2.getValue()).toString());
      expect(scalar3.wgslStrAsInt).toBe('15');
    });
  });

  describe('Utility methods', () => {
    test('toString returns string representation', () => {
      const scalar = Scalar.fromCopyNumber(42.5);
      expect(scalar.toString()).toBe('(42.5)');
    });

    test('clone creates a copy of the scalar', () => {
      const original = Scalar.fromCopyNumber(99);
      const cloned = original.clone();

      expect(cloned.getValue()).toBe(99);
      expect(cloned).not.toBe(original); // Different instances
      expect(cloned.raw).not.toBe(original.raw); // Different underlying arrays (deep copy)
    });

    test('clone creates independent copy (modifying original does not affect clone)', () => {
      const original = Scalar.fromCopyNumber(42);
      const cloned = original.clone();

      // Verify original independence by modifying the underlying array
      original.raw[0] = 100;

      expect(original.getValue()).toBe(100);
      expect(cloned.getValue()).toBe(42); // Clone should remain unchanged
    });

    test('className returns correct class name', () => {
      const scalar = Scalar.fromCopyNumber(1);
      expect(scalar.className).toBe('Scalar');
    });

    test('bytesPerComponent returns correct byte size for Float32Array', () => {
      const scalar = Scalar.fromCopyNumber(1);
      expect(scalar.bytesPerComponent).toBe(4); // Float32Array
    });
  });

  describe('Static properties', () => {
    test('compositionType returns Scalar composition type', () => {
      expect(Scalar.compositionType).toBe(CompositionType.Scalar);
      expect(Scalar.compositionType.index).toBe(0);
    });
  });

  describe('Edge cases', () => {
    test('handles positive infinity', () => {
      const scalar = Scalar.fromCopyNumber(Number.POSITIVE_INFINITY);
      expect(scalar.getValue()).toBe(Number.POSITIVE_INFINITY);
      expect(scalar.glslStrAsFloat).toBe('Infinity');
    });

    test('handles negative infinity', () => {
      const scalar = Scalar.fromCopyNumber(Number.NEGATIVE_INFINITY);
      expect(scalar.getValue()).toBe(Number.NEGATIVE_INFINITY);
      expect(scalar.glslStrAsFloat).toBe('-Infinity');
    });

    test('handles NaN', () => {
      const scalar = Scalar.fromCopyNumber(Number.NaN);
      expect(scalar.getValue()).toBeNaN();
      expect(scalar.glslStrAsFloat).toBe('NaN');
    });

    test('handles very large numbers', () => {
      const largeNumber = 1e10; // Use a number within Float32 precision range
      const scalar = Scalar.fromCopyNumber(largeNumber);
      expect(scalar.getValue()).toBeCloseTo(largeNumber, 1);
    });

    test('handles very small numbers', () => {
      const smallNumber = 1e-30; // Use a reasonable small number
      const scalar = Scalar.fromCopyNumber(smallNumber);
      expect(scalar.getValue()).toBeCloseTo(smallNumber, 35);
    });

    test('handles negative zero', () => {
      const scalar = Scalar.fromCopyNumber(-0);
      expect(scalar.getValue()).toBe(-0);
      expect(Object.is(scalar.getValue(), -0)).toBe(true);
    });

    test('handles float precision limitations', () => {
      const impreciseValue = 0.1 + 0.2; // Known to be imprecise in floating point
      const scalar = Scalar.fromCopyNumber(impreciseValue);
      expect(scalar.getValue()).toBeCloseTo(0.3, 6);
      expect(scalar.getValue()).not.toBe(0.3); // Due to floating point precision
    });
  });
});

describe('Scalard (double precision)', () => {
  test('fromCopyNumber creates double precision scalar', () => {
    const scalar = Scalard.fromCopyNumber(1.23456789012345);
    expect(scalar.getValue()).toBe(1.23456789012345);
  });

  test('zero creates double precision scalar with value 0', () => {
    const scalar = Scalard.zero();
    expect(scalar.getValue()).toBe(0);
  });

  test('one creates double precision scalar with value 1', () => {
    const scalar = Scalard.one();
    expect(scalar.getValue()).toBe(1);
  });

  test('bytesPerComponent returns 8 for double precision', () => {
    const scalar = Scalard.fromCopyNumber(1);
    expect(scalar.bytesPerComponent).toBe(8); // Float64Array
  });

  test('clone creates a copy of the double precision scalar', () => {
    const original = Scalard.fromCopyNumber(Math.PI);
    const cloned = original.clone();

    expect(cloned.getValue()).toBe(Math.PI);
    expect(cloned).not.toBe(original);
    expect(cloned.raw).not.toBe(original.raw); // Different underlying arrays (deep copy)
  });

  test('clone creates independent copy for double precision', () => {
    const original = Scalard.fromCopyNumber(Math.E);
    const cloned = original.clone();

    // Verify independence by modifying the underlying array
    original.raw[0] = 999.999;

    expect(original.getValue()).toBe(999.999);
    expect(cloned.getValue()).toBe(Math.E); // Clone should remain unchanged
  });

  test('handles high precision values', () => {
    const highPrecisionValue = 1.7976931348623157e100; // Large but not max double
    const scalar = Scalard.fromCopyNumber(highPrecisionValue);
    expect(scalar.getValue()).toBe(highPrecisionValue);
  });

  test('maintains precision better than 32-bit', () => {
    const preciseValue = 0.1234567890123456;
    const scalar32 = Scalar.fromCopyNumber(preciseValue);
    const scalar64 = Scalard.fromCopyNumber(preciseValue);

    // Double precision should maintain more decimal places
    expect(scalar64.getValue()).toBeCloseTo(preciseValue, 15);
    // Single precision will have less precision
    expect(scalar32.getValue()).toBeCloseTo(preciseValue, 6);
  });

  test('comparison methods work with double precision', () => {
    const scalar1 = Scalard.fromCopyNumber(1.000000000000001);
    const scalar2 = Scalard.fromCopyNumber(1.000000000000002);

    expect(scalar1.isStrictEqual(scalar2)).toBe(false);
    expect(scalar1.isEqual(scalar2, 1e-14)).toBe(true);
    expect(scalar1.isEqual(scalar2, 1e-16)).toBe(false);
  });

  test('dummy creates empty dummy double precision scalar', () => {
    const scalar = Scalard.dummy();
    expect(scalar.isDummy()).toBe(true);
  });
});
