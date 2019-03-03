import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface CompositionTypeEnum extends EnumIO {
  getNumberOfComponents(): Count;
}

class CompositionTypeClass extends EnumClass implements CompositionTypeEnum {
  readonly __numberOfComponents: number = 0;
  constructor({index, str, numberOfComponents} : {index: number, str: string, numberOfComponents: number}) {
    super({index, str});
    this.__numberOfComponents = numberOfComponents;
  }

  getNumberOfComponents(): Count {
    return this.__numberOfComponents;
  }
}

const Unknown: CompositionTypeEnum = new CompositionTypeClass({index:-1, str:'UNKNOWN', numberOfComponents: 0});
const Scalar: CompositionTypeEnum = new CompositionTypeClass({index:0, str:'SCALAR', numberOfComponents: 1});
const Vec2: CompositionTypeEnum = new CompositionTypeClass({index:1, str:'VEC2', numberOfComponents: 2});
const Vec3: CompositionTypeEnum = new CompositionTypeClass({index:2, str:'VEC3', numberOfComponents: 3});
const Vec4: CompositionTypeEnum = new CompositionTypeClass({index:3, str:'VEC4', numberOfComponents: 4});
const Mat2: CompositionTypeEnum = new CompositionTypeClass({index:4, str:'MAT2', numberOfComponents: 4});
const Mat3: CompositionTypeEnum = new CompositionTypeClass({index:5, str:'MAT3', numberOfComponents: 9});
const Mat4: CompositionTypeEnum = new CompositionTypeClass({index:6, str:'MAT4', numberOfComponents: 16});
const Texture2D: CompositionTypeEnum = new CompositionTypeClass({index:7, str:'TEXTURE_2D', numberOfComponents: 1});
const TextureCube: CompositionTypeEnum = new CompositionTypeClass({index:8, str:'TEXTURE_CUBE', numberOfComponents: 1});


const typeList = [Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube];

function from( index : number ): CompositionTypeEnum {
  return _from({typeList, index}) as CompositionTypeEnum;
}

function fromString( str: string ): CompositionTypeEnum {
  return _fromString({typeList, str}) as CompositionTypeEnum;
}

export const CompositionType = Object.freeze({ Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, Texture2D, TextureCube, from, fromString });
