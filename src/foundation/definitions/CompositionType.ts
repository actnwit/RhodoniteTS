import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { ComponentType, ComponentTypeEnum } from "./ComponentType";
import { Count } from "../../commontypes/CommonTypes";

export interface CompositionTypeEnum extends EnumIO {
  getNumberOfComponents(): Count;
  getGlslStr(componentType: ComponentTypeEnum): string;
  getGlslInitialValue(componentType: ComponentTypeEnum): string;
}

class CompositionTypeClass extends EnumClass implements CompositionTypeEnum {
  readonly __numberOfComponents: number = 0;
  readonly __glslStr: string;
  readonly __hlslStr: string;
  readonly __isArray: boolean;
  constructor({ index, str, glslStr, hlslStr, numberOfComponents, isArray = false }:
    { index: number, str: string, glslStr: string, hlslStr: string, numberOfComponents: number, isArray?: boolean }) {
    super({ index, str });
    this.__numberOfComponents = numberOfComponents;
    this.__glslStr = glslStr;
    this.__hlslStr = hlslStr;
    this.__isArray = isArray;
  }

  getNumberOfComponents(): Count {
    return this.__numberOfComponents;
  }

  getGlslStr(componentType: ComponentTypeEnum) {
    if (componentType === ComponentType.Float || componentType === ComponentType.Double || this === CompositionType.Texture2D || this === CompositionType.TextureCube) {
      return this.__glslStr;
    } else if (componentType === ComponentType.Byte || componentType === ComponentType.Short || componentType === ComponentType.Int) {
      if (this === CompositionType.Scalar || this == CompositionType.ScalarArray) {
        return 'int';
      } else {
        return 'i' + this.__glslStr;
      }
    } else if (componentType === ComponentType.Bool) {
      return 'bool';
    }
    return 'unknown';
  }

  getGlslInitialValue(componentType: ComponentTypeEnum) {
    if (componentType === ComponentType.Float || componentType === ComponentType.Double) {
      if (this === CompositionType.Scalar) {
        return '0.0';
      } else {
        if (this.__numberOfComponents === 2) {
          return this.__glslStr + '(0.0, 0.0)';
        } else if (this.__numberOfComponents === 3) {
          return this.__glslStr + '(0.0, 0.0, 0.0)';
        } else if (this.__numberOfComponents === 4) {
          return this.__glslStr + '(0.0, 0.0, 0.0, 0.0)';
        } else if (this.__numberOfComponents === 9) {
          return this.__glslStr + '(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)';
        } else if (this.__numberOfComponents === 16) {
          return this.__glslStr + '(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)';
        }
      }
    } else if (componentType === ComponentType.Byte || componentType === ComponentType.Short || componentType === ComponentType.Int) {
      if (this === CompositionType.Scalar) {
        return '0';
      } else {
        if (this.__numberOfComponents === 2) {
          return this.__glslStr + '(0, 0)';
        } else if (this.__numberOfComponents === 3) {
          return this.__glslStr + '(0, 0, 0)';
        } else if (this.__numberOfComponents === 4) {
          return this.__glslStr + '(0, 0, 0, 0)';
        } else if (this.__numberOfComponents === 9) {
          return this.__glslStr + '(0, 0, 0, 0, 0, 0, 0, 0, 0)';
        } else if (this.__numberOfComponents === 16) {
          return this.__glslStr + '(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)';
        }
      }
    } else if (componentType === ComponentType.Bool) {
      if (this === CompositionType.Scalar) {
        return 'false';
      } else {
        if (this.__numberOfComponents === 2) {
          return this.__glslStr + '(false, false)';
        } else if (this.__numberOfComponents === 3) {
          return this.__glslStr + '(false, false, false)';
        } else if (this.__numberOfComponents === 4) {
          return this.__glslStr + '(false, false, false, false)';
        }
      }
    }
    return 'unknown';
  }
}

const Unknown: CompositionTypeEnum = new CompositionTypeClass({ index: -1, str: 'UNKNOWN', glslStr: 'unknown', hlslStr: 'unknown', numberOfComponents: 0 });
const Scalar: CompositionTypeEnum = new CompositionTypeClass({ index: 0, str: 'SCALAR', glslStr: 'float', hlslStr: 'float', numberOfComponents: 1 });
const Vec2: CompositionTypeEnum = new CompositionTypeClass({ index: 1, str: 'VEC2', glslStr: 'vec2', hlslStr: 'float2', numberOfComponents: 2 });
const Vec3: CompositionTypeEnum = new CompositionTypeClass({ index: 2, str: 'VEC3', glslStr: 'vec3', hlslStr: 'float3', numberOfComponents: 3 });
const Vec4: CompositionTypeEnum = new CompositionTypeClass({ index: 3, str: 'VEC4', glslStr: 'vec4', hlslStr: 'float4', numberOfComponents: 4 });
const Mat2: CompositionTypeEnum = new CompositionTypeClass({ index: 4, str: 'MAT2', glslStr: 'mat2', hlslStr: 'float2x2', numberOfComponents: 4 });
const Mat3: CompositionTypeEnum = new CompositionTypeClass({ index: 5, str: 'MAT3', glslStr: 'mat3', hlslStr: 'float3x3', numberOfComponents: 9 });
const Mat4: CompositionTypeEnum = new CompositionTypeClass({ index: 6, str: 'MAT4', glslStr: 'mat4', hlslStr: 'float4x4', numberOfComponents: 16 });
const Texture2D: CompositionTypeEnum = new CompositionTypeClass({ index: 7, str: 'TEXTURE_2D', glslStr: 'sampler2D', hlslStr: 'Texture2D', numberOfComponents: 1 });
const TextureCube: CompositionTypeEnum = new CompositionTypeClass({ index: 8, str: 'TEXTURE_CUBE_MAP', glslStr: 'samplerCube', hlslStr: 'TextureCube', numberOfComponents: 1 });
const ScalarArray: CompositionTypeEnum = new CompositionTypeClass({ index: 9, str: 'SCALAR_ARRAY', glslStr: 'float', hlslStr: 'float', numberOfComponents: 1, isArray: true });
const Vec2Array: CompositionTypeEnum = new CompositionTypeClass({ index: 10, str: 'VEC2_ARRAY', glslStr: 'vec2', hlslStr: 'float2', numberOfComponents: 2, isArray: true });
const Vec3Array: CompositionTypeEnum = new CompositionTypeClass({ index: 11, str: 'VEC3_ARRAY', glslStr: 'vec3', hlslStr: 'float3', numberOfComponents: 3, isArray: true });
const Vec4Array: CompositionTypeEnum = new CompositionTypeClass({ index: 12, str: 'VEC4_ARRAY', glslStr: 'vec4', hlslStr: 'float4', numberOfComponents: 4, isArray: true });
const Mat4Array: CompositionTypeEnum = new CompositionTypeClass({ index: 13, str: 'MAT4_ARRAY', glslStr: 'mat4', hlslStr: 'float4x4', numberOfComponents: 16, isArray: true });
const Mat3Array: CompositionTypeEnum = new CompositionTypeClass({ index: 14, str: 'MAT3_ARRAY', glslStr: 'mat3', hlslStr: 'float3x3', numberOfComponents: 9, isArray: true });
const Mat2Array: CompositionTypeEnum = new CompositionTypeClass({ index: 15, str: 'MAT2_ARRAY', glslStr: 'mat2', hlslStr: 'float2x2', numberOfComponents: 4, isArray: true });

const typeList = [
  Unknown, Scalar, Vec2, Vec3, Vec4,
  Mat2, Mat3, Mat4,
  Vec2Array, Vec3Array, Vec4Array,
  ScalarArray, Mat2Array, Mat3Array, Mat4Array,
  Texture2D, TextureCube
];

function from(index: number): CompositionTypeEnum {
  return _from({ typeList, index }) as CompositionTypeEnum;
}

function fromString(str: string): CompositionTypeEnum {
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function fromGlslString(str_: string): CompositionTypeEnum {
  let str = str_;
  switch (str_) {
    case 'int': str = 'scalar'; break;
    case 'float': str = 'scalar'; break;
    case 'ivec2': str = 'vec2'; break;
    case 'ivec3': str = 'vec3'; break;
    case 'ivec4': str = 'vec4'; break;
    case 'sampler2D': str = 'TEXTURE_2D'; break;
    case 'samplerCube': str = 'TEXTURE_CUBE_MAP'; break;
  }
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function isArray(compositionType: CompositionTypeEnum) {
  if (compositionType === ScalarArray || compositionType === Vec2Array || compositionType === Vec3Array || compositionType === Vec4Array ||
    compositionType === Mat4Array || compositionType === Mat3Array || compositionType === Mat2Array) {
    return true;
  } else {
    return false;
  }
}

function isTexture(compositionType: CompositionTypeEnum) {
  if (compositionType === Texture2D || compositionType === TextureCube) {
    return true;
  } else {
    return false;
  }
}

export const CompositionType = Object.freeze({
  Unknown, Scalar, Vec2, Vec3, Vec4,
  Mat2, Mat3, Mat4,
  ScalarArray, Vec2Array, Vec3Array, Vec4Array,
  Mat2Array, Mat3Array, Mat4Array,
  Texture2D, TextureCube,
  from, fromString, fromGlslString, isArray, isTexture
});
