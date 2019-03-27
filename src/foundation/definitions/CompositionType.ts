import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { ComponentTypeEnum } from "../main";
import { ComponentType } from "./ComponentType";

export interface CompositionTypeEnum extends EnumIO {
  getNumberOfComponents(): Count;
  getGlslStr(componentType: ComponentTypeEnum): string;
}

class CompositionTypeClass extends EnumClass implements CompositionTypeEnum {
  readonly __numberOfComponents: number = 0;
  readonly __glslStr: string;
  readonly __hlslStr: string;
  constructor({index, str, glslStr, hlslStr, numberOfComponents} : {index: number, str: string, glslStr: string, hlslStr: string, numberOfComponents: number}) {
    super({index, str});
    this.__numberOfComponents = numberOfComponents;
    this.__glslStr = glslStr;
    this.__hlslStr = hlslStr;
  }

  getNumberOfComponents(): Count {
    return this.__numberOfComponents;
  }

  getGlslStr(componentType: ComponentTypeEnum) {
    if (componentType === ComponentType.Float || componentType === ComponentType.Double) {
      return this.__glslStr;
    } else if (componentType === ComponentType.Byte || componentType === ComponentType.Short || componentType === ComponentType.Int) {
      if (this === CompositionType.Scalar) {
        return 'int';
      } else {
        return 'i' + this.__glslStr;
      }
    }
    return 'unknown';
  }
}

const Unknown: CompositionTypeEnum = new CompositionTypeClass({index:-1, str:'UNKNOWN', glslStr: 'unknown', hlslStr:'unknown',  numberOfComponents: 0});
const Scalar: CompositionTypeEnum = new CompositionTypeClass({index:0, str:'SCALAR', glslStr: 'float', hlslStr:'float', numberOfComponents: 1});
const Vec2: CompositionTypeEnum = new CompositionTypeClass({index:1, str:'VEC2', glslStr: 'vec2', hlslStr:'float2', numberOfComponents: 2});
const Vec3: CompositionTypeEnum = new CompositionTypeClass({index:2, str:'VEC3', glslStr: 'vec3', hlslStr:'float3', numberOfComponents: 3});
const Vec4: CompositionTypeEnum = new CompositionTypeClass({index:3, str:'VEC4', glslStr: 'vec4', hlslStr:'float4', numberOfComponents: 4});
const Mat2: CompositionTypeEnum = new CompositionTypeClass({index:4, str:'MAT2', glslStr: 'mat2', hlslStr:'float2x2', numberOfComponents: 4});
const Mat3: CompositionTypeEnum = new CompositionTypeClass({index:5, str:'MAT3', glslStr: 'mat3', hlslStr:'float3x3', numberOfComponents: 9});
const Mat4: CompositionTypeEnum = new CompositionTypeClass({index:6, str:'MAT4', glslStr: 'mat4', hlslStr:'float4x4', numberOfComponents: 16});
const Texture2D: CompositionTypeEnum = new CompositionTypeClass({index:7, str:'TEXTURE_2D', glslStr: 'sampler2D', hlslStr:'Texture2D', numberOfComponents: 1});
const TextureCube: CompositionTypeEnum = new CompositionTypeClass({index:8, str:'TEXTURE_CUBE', glslStr: 'samplerCube', hlslStr:'TextureCube', numberOfComponents: 1});


const typeList = [Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube];

function from( index : number ): CompositionTypeEnum {
  return _from({typeList, index}) as CompositionTypeEnum;
}

function fromString( str: string ): CompositionTypeEnum {
  return _fromString({typeList, str}) as CompositionTypeEnum;
}

export const CompositionType = Object.freeze({ Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube, from, fromString });
