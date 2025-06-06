import type { TypedArray, TypedArrayConstructor } from '../../types/CommonTypes';
import type { Gltf2AccessorComponentTypeNumber } from '../../types/glTF2';
import { EnumClass, type EnumIO, _from, _fromString } from '../misc/EnumIO';

export interface ComponentTypeEnum extends EnumIO {
  wgsl: string;
  webgpu: string;
  getSizeInBytes(): number;
  isFloatingPoint(): boolean;
  isInteger(): boolean;
}

class ComponentTypeClass<TypeName extends string> extends EnumClass implements ComponentTypeEnum {
  readonly __webgpu: string;
  readonly __wgsl: string;
  readonly __sizeInBytes: number;
  readonly __dummyStr: TypeName;
  constructor({
    index,
    str,
    sizeInBytes,
    wgsl,
    webgpu,
  }: {
    index: number;
    str: TypeName;
    sizeInBytes: number;
    wgsl: string;
    webgpu: string;
  }) {
    super({ index, str });
    this.__sizeInBytes = sizeInBytes;
    this.__webgpu = webgpu;
    this.__wgsl = wgsl;
    this.__dummyStr = str;
  }

  get wgsl(): string {
    return this.__wgsl;
  }

  get webgpu(): string {
    return this.__webgpu;
  }

  getSizeInBytes(): number {
    return this.__sizeInBytes;
  }

  isFloatingPoint() {
    if (
      this.index === 5126 || // Float
      this.index === 5127 || // Double
      this.index === 0x8d61 // HalfFloat
    ) {
      return true;
    }

    return false;
  }

  isInteger() {
    if (
      this.index === 5120 || // Byte
      this.index === 5122 || // Short
      this.index === 5124 // Int
    ) {
      return true;
    }

    return false;
  }

  isUnsignedInteger() {
    if (
      this.index === 5121 || // UnsignedByte
      this.index === 5123 || // UnsignedShort
      this.index === 5125 // UnsignedInt
    ) {
      return true;
    }
    return false;
  }
}

const Unknown = new ComponentTypeClass({
  index: 5119,
  str: 'UNKNOWN',
  sizeInBytes: 0,
  wgsl: 'unknown',
  webgpu: 'unknown',
});
const Byte = new ComponentTypeClass({
  index: 5120,
  str: 'BYTE',
  sizeInBytes: 1,
  wgsl: 'i32',
  webgpu: 'sint8',
});
const UnsignedByte = new ComponentTypeClass({
  index: 5121,
  str: 'UNSIGNED_BYTE',
  sizeInBytes: 1,
  wgsl: 'u32',
  webgpu: 'uint8',
});
const Short = new ComponentTypeClass({
  index: 5122,
  str: 'SHORT',
  sizeInBytes: 2,
  wgsl: 'i32',
  webgpu: 'sint16',
});
const UnsignedShort = new ComponentTypeClass({
  index: 5123,
  str: 'UNSIGNED_SHORT',
  sizeInBytes: 2,
  wgsl: 'u32',
  webgpu: 'uint16',
});
const Int = new ComponentTypeClass({
  index: 5124,
  str: 'INT',
  sizeInBytes: 4,
  wgsl: 'i32',
  webgpu: 'sint32',
});
const UnsignedInt = new ComponentTypeClass({
  index: 5125,
  str: 'UNSIGNED_INT',
  sizeInBytes: 4,
  wgsl: 'u32',
  webgpu: 'uint32',
});
const Float = new ComponentTypeClass({
  index: 5126,
  str: 'FLOAT',
  sizeInBytes: 4,
  wgsl: 'f32',
  webgpu: 'float32',
});
const Double = new ComponentTypeClass({
  index: 5127,
  str: 'DOUBLE',
  sizeInBytes: 8,
  wgsl: 'f32',
  webgpu: 'float64',
});
const Bool = new ComponentTypeClass({
  index: 35670,
  str: 'BOOL',
  sizeInBytes: 1,
  wgsl: 'bool',
  webgpu: 'bool',
});
const HalfFloat = new ComponentTypeClass({
  index: 0x140b,
  str: 'HALF_FLOAT',
  sizeInBytes: 2,
  wgsl: 'f16',
  webgpu: 'float16',
});

const typeList = [Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsignedInt, Float, Double, HalfFloat, Bool];

function from(index: number): ComponentTypeEnum {
  return _from({ typeList, index }) as ComponentTypeEnum;
}

function fromString(str: string): ComponentTypeEnum {
  return _fromString({ typeList, str }) as ComponentTypeEnum;
}

function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum {
  if (typedArray instanceof Int8Array) {
    return Byte;
  }
  if (typedArray instanceof Uint8Array || typedArray instanceof Uint8ClampedArray) {
    return UnsignedByte;
  }
  if (typedArray instanceof Int16Array) {
    return Short;
  }
  if (typedArray instanceof Uint16Array) {
    return UnsignedShort;
  }
  if (typedArray instanceof Int32Array) {
    return Int;
  }
  if (typedArray instanceof Uint32Array) {
    return UnsignedInt;
  }
  if (typedArray instanceof Float32Array) {
    return Float;
  }
  if (typedArray instanceof Float64Array) {
    return Double;
  }

  return Unknown;
}

function toTypedArray(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined {
  if (componentType === Byte) {
    return Int8Array;
  }
  if (componentType === UnsignedByte) {
    return Uint8Array;
  }
  if (componentType === Short) {
    return Int16Array;
  }
  if (componentType === UnsignedShort) {
    return Uint16Array;
  }
  if (componentType === Int) {
    return Int32Array;
  }
  if (componentType === UnsignedInt) {
    return Uint32Array;
  }
  if (componentType === Float) {
    return Float32Array;
  }
  if (componentType === Double) {
    return Float64Array;
  }
  return undefined;
}

function fromWgslString(str_: string): ComponentTypeEnum {
  let str = str_;
  switch (str_) {
    case 'bool':
      str = 'BOOL';
      break;
    case 'i32':
      str = 'INT';
      break;
    case 'u32':
      str = 'UNSIGNED_INT';
      break;
    case 'f32':
      str = 'FLOAT';
      break;
    case 'vec2<f32>':
      str = 'FLOAT';
      break;
    case 'vec3<f32>':
      str = 'FLOAT';
      break;
    case 'vec4<f32>':
      str = 'FLOAT';
      break;
    case 'mat2x2<f32>':
      str = 'FLOAT';
      break;
    case 'mat3x3<f32>':
      str = 'FLOAT';
      break;
    case 'mat4x4<f32>':
      str = 'FLOAT';
      break;
    case 'vec2<i32>':
      str = 'INT';
      break;
    case 'vec3<i32>':
      str = 'INT';
      break;
    case 'vec4<i32>':
      str = 'INT';
      break;
    case 'sampler_2d':
      str = 'INT';
      break;
    case 'sampler_2d_shadow':
      str = 'INT';
      break;
    case 'sampler_3d':
      str = 'INT';
      break;
    case 'sampler_cube':
      str = 'INT';
      break;
  }
  return _fromString({ typeList, str }) as ComponentTypeEnum;
}

function fromGlslString(str_: string): ComponentTypeEnum {
  let str = str_;
  switch (str_) {
    case 'bool':
      str = 'BOOL';
      break;
    case 'int':
      str = 'INT';
      break;
    case 'float':
      str = 'FLOAT';
      break;
    case 'vec2':
      str = 'FLOAT';
      break;
    case 'vec3':
      str = 'FLOAT';
      break;
    case 'vec4':
      str = 'FLOAT';
      break;
    case 'mat2':
      str = 'FLOAT';
      break;
    case 'mat3':
      str = 'FLOAT';
      break;
    case 'mat4':
      str = 'FLOAT';
      break;
    case 'ivec2':
      str = 'INT';
      break;
    case 'ivec3':
      str = 'INT';
      break;
    case 'ivec4':
      str = 'INT';
      break;
    case 'sampler2D':
      str = 'INT';
      break;
    case 'sampler2DShadow':
      str = 'INT';
      break;
    case 'sampler2DRect':
      str = 'INT';
      break;
    case 'sampler3D':
      str = 'INT';
      break;
    case 'samplerCube':
      str = 'INT';
      break;
  }
  return _fromString({ typeList, str }) as ComponentTypeEnum;
}

export type Gltf2AccessorComponentType =
  | typeof Byte
  | typeof UnsignedByte
  | typeof Short
  | typeof UnsignedShort
  | typeof Int
  | typeof UnsignedInt
  | typeof Float;

function toGltf2AccessorComponentType(componentTypeForGltf2: ComponentTypeEnum): Gltf2AccessorComponentTypeNumber {
  return componentTypeForGltf2.index as Gltf2AccessorComponentTypeNumber;
}

export const ComponentType = Object.freeze({
  Unknown,
  Byte,
  UnsignedByte,
  Short,
  UnsignedShort,
  Int,
  UnsignedInt,
  Float,
  Double,
  Bool,
  HalfFloat,
  from,
  fromTypedArray,
  toTypedArray,
  toGltf2AccessorComponentType,
  fromString,
  fromGlslString,
  fromWgslString,
});
