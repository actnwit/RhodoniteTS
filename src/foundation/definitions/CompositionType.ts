import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { ComponentTypeEnum } from "../main";
import { ComponentType } from "./ComponentType";
import { Count } from "../../types/CommonTypes";

export interface CompositionTypeEnum extends EnumIO {
  getNumberOfComponents(): Count;
  getGlslStr(componentType: ComponentTypeEnum): string;
}

class CompositionTypeClass extends EnumClass implements CompositionTypeEnum {
  readonly __numberOfComponents: number = 0;
  readonly __glslStr: string;
  readonly __hlslStr: string;
  constructor({ index, str, glslStr, hlslStr, numberOfComponents }: { index: number, str: string, glslStr: string, hlslStr: string, numberOfComponents: number }) {
    super({ index, str });
    this.__numberOfComponents = numberOfComponents;
    this.__glslStr = glslStr;
    this.__hlslStr = hlslStr;
  }

  getNumberOfComponents(): Count {
    return this.__numberOfComponents;
  }

  getGlslStr(componentType: ComponentTypeEnum) {
    if (componentType === ComponentType.Float || componentType === ComponentType.Double || this === CompositionType.Texture2D || this === CompositionType.TextureCube) {
      return this.__glslStr;
    } else if (componentType === ComponentType.Byte || componentType === ComponentType.Short || componentType === ComponentType.Int) {
      if (this === CompositionType.Scalar) {
        return 'int';
      } else {
        return 'i' + this.__glslStr;
      }
    } else if (componentType === ComponentType.Bool) {
      return 'bool';
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
const ScalarArray: CompositionTypeEnum = new CompositionTypeClass({ index: 9, str: 'SCALAR_ARRAY', glslStr: 'float', hlslStr: 'float', numberOfComponents: 1 });
const Vec2Array: CompositionTypeEnum = new CompositionTypeClass({ index: 10, str: 'VEC2_ARRAY', glslStr: 'vec2', hlslStr: 'float2', numberOfComponents: 2 });
const Vec3Array: CompositionTypeEnum = new CompositionTypeClass({ index: 11, str: 'VEC3_ARRAY', glslStr: 'vec3', hlslStr: 'float3', numberOfComponents: 3 });
const Vec4Array: CompositionTypeEnum = new CompositionTypeClass({ index: 12, str: 'VEC4_ARRAY', glslStr: 'vec4', hlslStr: 'float4', numberOfComponents: 4 });

const typeList = [Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube, ScalarArray, Vec2Array, Vec3Array, Vec4Array];

function from(index: number): CompositionTypeEnum {
  return _from({ typeList, index }) as CompositionTypeEnum;
}

function fromString(str: string): CompositionTypeEnum {
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function isArray(compositionType: CompositionTypeEnum) {
  if (compositionType === ScalarArray || compositionType === Vec2Array || compositionType === Vec3Array || compositionType === Vec4Array) {
    return true;
  } else {
    return false;
  }
}

export const CompositionType = Object.freeze({ Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube, ScalarArray, Vec2Array, Vec3Array, Vec4Array, from, fromString, isArray });
