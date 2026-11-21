/**
 * Converts Float32 values to IEEE 754 half-float (Float16) bits.
 *
 * HDR textures are uploaded as half floats on devices without the optional
 * `float32-filterable` feature (e.g. iOS Safari). There an `rgba32float` texture cannot be
 * bound with the default `sampleType: 'float'` of the texture bind group layouts, so every
 * draw using it is rejected. Filtering 16-bit float textures is core WebGPU, so half floats
 * work everywhere.
 *
 * The conversion rounds to nearest, ties to even, and handles denormals, Infinity and NaN
 * exactly like the platform `Float16Array` conversion.
 *
 * @param src - Float32 values
 * @returns The same values encoded as half-float bits
 */
export declare function convertFloat32ToFloat16Bits(src: Float32Array): Uint16Array;
