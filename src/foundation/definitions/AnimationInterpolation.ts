import { Gltf2AnimationSamplerInterpolation } from '../../types/glTF2';
import { EnumClass, EnumIO, _from, _fromString } from '../misc/EnumIO';

export interface AnimationInterpolationEnum extends EnumIO {
  GltfString: Gltf2AnimationSamplerInterpolation;
}
class AnimationInterpolationClass extends EnumClass implements AnimationInterpolationEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }

  get GltfString(): Gltf2AnimationSamplerInterpolation {
    return this.str.toUpperCase() as Gltf2AnimationSamplerInterpolation;
  }
}

const Linear: AnimationInterpolationEnum = new AnimationInterpolationClass({
  index: 0,
  str: 'Linear',
});
const Step: AnimationInterpolationEnum = new AnimationInterpolationClass({
  index: 1,
  str: 'Step',
});
const CubicSpline: AnimationInterpolationEnum = new AnimationInterpolationClass({
  index: 2,
  str: 'CubicSpline',
});

const typeList = [Linear, Step, CubicSpline];

function from(index: number): AnimationInterpolationEnum {
  return _from({ typeList, index }) as AnimationInterpolationEnum;
}

function fromString(str: string): AnimationInterpolationEnum {
  return _fromString({ typeList, str }) as AnimationInterpolationEnum;
}

export const AnimationInterpolation = Object.freeze({
  Linear,
  Step,
  CubicSpline,
  from,
  fromString,
});
