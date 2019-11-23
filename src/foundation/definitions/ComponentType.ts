import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { TypedArray, Byte } from "../../types/CommonTypes";

export interface ComponentTypeEnum extends EnumIO {
  getSizeInBytes(): Byte;
}

class ComponentTypeClass extends EnumClass implements ComponentTypeEnum {
  readonly __sizeInBytes: number;
  constructor({ index, str, sizeInBytes }: { index: number, str: string, sizeInBytes: number }) {
    super({ index, str });
    this.__sizeInBytes = sizeInBytes
  }

  getSizeInBytes(): Byte {
    return this.__sizeInBytes;
  }
}

const Unknown: ComponentTypeEnum = new ComponentTypeClass({ index: 5119, str: 'UNKNOWN', sizeInBytes: 0 });
const Byte: ComponentTypeEnum = new ComponentTypeClass({ index: 5120, str: 'BYTE', sizeInBytes: 1 });
const UnsignedByte: ComponentTypeEnum = new ComponentTypeClass({ index: 5121, str: 'UNSIGNED_BYTE', sizeInBytes: 1 });
const Short: ComponentTypeEnum = new ComponentTypeClass({ index: 5122, str: 'SHORT', sizeInBytes: 2 });
const UnsignedShort: ComponentTypeEnum = new ComponentTypeClass({ index: 5123, str: 'UNSIGNED_SHORT', sizeInBytes: 2 });
const Int: ComponentTypeEnum = new ComponentTypeClass({ index: 5124, str: 'INT', sizeInBytes: 4 });
const UnsingedInt: ComponentTypeEnum = new ComponentTypeClass({ index: 5125, str: 'UNSIGNED_INT', sizeInBytes: 4 });
const Float: ComponentTypeEnum = new ComponentTypeClass({ index: 5126, str: 'FLOAT', sizeInBytes: 4 });
const Double: ComponentTypeEnum = new ComponentTypeClass({ index: 5127, str: 'DOUBLE', sizeInBytes: 8 });
const Bool: ComponentTypeEnum = new ComponentTypeClass({ index: 35670, str: 'BOOL', sizeInBytes: 1 });
const HalfFloat: ComponentTypeEnum = new ComponentTypeClass({ index: 0x8D61, str: 'HALF_FLOAT_OES', sizeInBytes: 2 });


const typeList = [Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, HalfFloat];

function from(index: number): ComponentTypeEnum {
  return _from({ typeList, index }) as ComponentTypeEnum;
}

function fromString(str: string): ComponentTypeEnum {
  return _fromString({ typeList, str }) as ComponentTypeEnum;
}

function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum {
  if (typedArray instanceof Int8Array) {
    return Byte;
  } else if (typedArray instanceof Uint8Array || typedArray instanceof Uint8ClampedArray) {
    return UnsignedByte;
  } else if (typedArray instanceof Int16Array) {
    return Short;
  } else if (typedArray instanceof Uint16Array) {
    return UnsignedShort;
  } else if (typedArray instanceof Int32Array) {
    return Int;
  } else if (typedArray instanceof Uint32Array) {
    return UnsingedInt;
  } else if (typedArray instanceof Float32Array) {
    return Float;
  } else if (typedArray instanceof Float64Array) {
    return Double;
  }

  return Unknown;
}

function fromGlslString(str_: string): ComponentTypeEnum {
  let str = str_;
  switch (str_) {
    case 'int': str = 'INT'; break;
    case 'float': str = 'FLOAT'; break;
    case 'vec2': str = 'FLOAT'; break;
    case 'vec3': str = 'FLOAT'; break;
    case 'vec4': str = 'FLOAT'; break;
    case 'mat2': str = 'FLOAT'; break;
    case 'mat3': str = 'FLOAT'; break;
    case 'mat4': str = 'FLOAT'; break;
    case 'ivec2': str = 'INT'; break;
    case 'ivec3': str = 'INT'; break;
    case 'ivec4': str = 'INT'; break;
  }
  return _fromString({ typeList, str }) as ComponentTypeEnum;
}

export const ComponentType = Object.freeze({ Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, Bool, HalfFloat, from, fromTypedArray, fromString, fromGlslString });
