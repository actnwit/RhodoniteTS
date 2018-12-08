import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface CompositionTypeEnum extends EnumIO {
}

class CompositionTypeClass extends EnumClass implements CompositionTypeEnum {
  readonly numberOfComponents: number = 0;
  constructor({index, str, numberOfComponent} : {index: number, str: string, numberOfComponent: number}) {
    super({index, str});
    this.numberOfComponents = numberOfComponent;
  }
}

const Unknown: CompositionTypeEnum = new CompositionTypeClass({index:-1, str:'UNKNOWN', numberOfComponent: 0});
const Scalar: CompositionTypeEnum = new CompositionTypeClass({index:0, str:'SCALAR', numberOfComponent: 1});
const Vec2: CompositionTypeEnum = new CompositionTypeClass({index:1, str:'VEC2', numberOfComponent: 2});
const Vec3: CompositionTypeEnum = new CompositionTypeClass({index:2, str:'VEC3', numberOfComponent: 3});
const Vec4: CompositionTypeEnum = new CompositionTypeClass({index:3, str:'VEC4', numberOfComponent: 4});
const Mat2: CompositionTypeEnum = new CompositionTypeClass({index:4, str:'MAT2', numberOfComponent: 4});
const Mat3: CompositionTypeEnum = new CompositionTypeClass({index:5, str:'MAT3', numberOfComponent: 9});
const Mat4: CompositionTypeEnum = new CompositionTypeClass({index:6, str:'MAT4', numberOfComponent: 16});

const typeList = [Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4];

function from({ index }: { index: number }): CompositionTypeEnum {
  return _from({typeList, index});
}

export const CompositionType = Object.freeze({ Unknown, Scalar, Vec2, Vec3, Vec4, Mat2, Mat3, Mat4, from });
