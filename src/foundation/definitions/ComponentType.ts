import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';
import {TypedArray, TypedArrayConstructor} from '../../types/CommonTypes';
import {Gltf2AccessorComponentTypeNumber} from '../../types/glTF2';

export interface ComponentTypeEnum extends EnumIO {
  getSizeInBytes(): number;
  isFloatingPoint(): boolean;
  isInteger(): boolean;
}

class ComponentTypeClass extends EnumClass implements ComponentTypeEnum {
  readonly __sizeInBytes: number;
  constructor({
    index,
    str,
    sizeInBytes,
  }: {
    index: number;
    str: string;
    sizeInBytes: number;
  }) {
    super({index, str});
    this.__sizeInBytes = sizeInBytes;
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
      this.index === 5121 || // UnsignedByte
      this.index === 5122 || // Short
      this.index === 5123 || // UnsignedShort
      this.index === 5124 || // Int
      this.index === 5125 // UnsignedInt
    ) {
      return true;
    }

    return false;
  }
}

const Unknown: ComponentTypeEnum = new ComponentTypeClass({
  index: 5119,
  str: 'UNKNOWN',
  sizeInBytes: 0,
});
const Byte: ComponentTypeEnum = new ComponentTypeClass({
  index: 5120,
  str: 'BYTE',
  sizeInBytes: 1,
});
const UnsignedByte: ComponentTypeEnum = new ComponentTypeClass({
  index: 5121,
  str: 'UNSIGNED_BYTE',
  sizeInBytes: 1,
});
const Short: ComponentTypeEnum = new ComponentTypeClass({
  index: 5122,
  str: 'SHORT',
  sizeInBytes: 2,
});
const UnsignedShort: ComponentTypeEnum = new ComponentTypeClass({
  index: 5123,
  str: 'UNSIGNED_SHORT',
  sizeInBytes: 2,
});
const Int: ComponentTypeEnum = new ComponentTypeClass({
  index: 5124,
  str: 'INT',
  sizeInBytes: 4,
});
const UnsignedInt: ComponentTypeEnum = new ComponentTypeClass({
  index: 5125,
  str: 'UNSIGNED_INT',
  sizeInBytes: 4,
});
const Float: ComponentTypeEnum = new ComponentTypeClass({
  index: 5126,
  str: 'FLOAT',
  sizeInBytes: 4,
});
const Double: ComponentTypeEnum = new ComponentTypeClass({
  index: 5127,
  str: 'DOUBLE',
  sizeInBytes: 8,
});
const Bool: ComponentTypeEnum = new ComponentTypeClass({
  index: 35670,
  str: 'BOOL',
  sizeInBytes: 1,
});
const HalfFloat: ComponentTypeEnum = new ComponentTypeClass({
  index: 0x8d61,
  str: 'HALF_FLOAT_OES',
  sizeInBytes: 2,
});

const typeList = [
  Unknown,
  Byte,
  UnsignedByte,
  Short,
  UnsignedShort,
  Int,
  UnsignedInt,
  Float,
  Double,
  HalfFloat,
];

function from(index: number): ComponentTypeEnum {
  return _from({typeList, index}) as ComponentTypeEnum;
}

function fromString(str: string): ComponentTypeEnum {
  return _fromString({typeList, str}) as ComponentTypeEnum;
}

function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum {
  if (typedArray instanceof Int8Array) {
    return Byte;
  } else if (
    typedArray instanceof Uint8Array ||
    typedArray instanceof Uint8ClampedArray
  ) {
    return UnsignedByte;
  } else if (typedArray instanceof Int16Array) {
    return Short;
  } else if (typedArray instanceof Uint16Array) {
    return UnsignedShort;
  } else if (typedArray instanceof Int32Array) {
    return Int;
  } else if (typedArray instanceof Uint32Array) {
    return UnsignedInt;
  } else if (typedArray instanceof Float32Array) {
    return Float;
  } else if (typedArray instanceof Float64Array) {
    return Double;
  }

  return Unknown;
}

function toTypedArray(
  componentType: ComponentTypeEnum
): TypedArrayConstructor | undefined {
  if (componentType === Byte) {
    return Int8Array;
  } else if (componentType === UnsignedByte) {
    return Uint8Array;
  } else if (componentType === Short) {
    return Int16Array;
  } else if (componentType === UnsignedShort) {
    return Uint16Array;
  } else if (componentType === Int) {
    return Int32Array;
  } else if (componentType === UnsignedInt) {
    return Uint32Array;
  } else if (componentType === Float) {
    return Float32Array;
  } else if (componentType === Double) {
    return Float64Array;
  } else {
    return undefined;
  }
}

function fromGlslString(str_: string): ComponentTypeEnum {
  let str = str_;
  switch (str_) {
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
    case 'sampler3D':
      str = 'INT';
      break;
    case 'samplerCube':
      str = 'INT';
      break;
  }
  return _fromString({typeList, str}) as ComponentTypeEnum;
}

export type Gltf2AccessorComponentType =
  | typeof Byte
  | typeof UnsignedByte
  | typeof Short
  | typeof UnsignedShort
  | typeof Int
  | typeof UnsignedInt
  | typeof Float;

function toGltf2AccessorComponentType(
  componentTypeForGltf2: Gltf2AccessorComponentType
): Gltf2AccessorComponentTypeNumber {
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
});
