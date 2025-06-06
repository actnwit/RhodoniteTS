import { EnumClass, type EnumIO, _from, _fromString } from '../misc/EnumIO';

export type AnimationAttributeEnum = EnumIO;

class AnimationAttributeClass extends EnumClass implements AnimationAttributeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const Quaternion: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 0,
  str: 'Quaternion',
});
const Translate: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 1,
  str: 'Translate',
});
const Scale: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 2,
  str: 'Scale',
});
const Weights: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 3,
  str: 'Weights',
});
const Effekseer: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 4,
  str: 'Effekseer',
});
const Vector4: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 5,
  str: 'Vector4',
});
const Vector3: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 6,
  str: 'Vector3',
});
const Vector2: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 7,
  str: 'Vector2',
});
const Scalar: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 8,
  str: 'Scalar',
});
const VectorN: AnimationAttributeEnum = new AnimationAttributeClass({
  index: 9,
  str: 'VectorN',
});

const typeList = [Quaternion, Translate, Scale, Weights, Effekseer, Vector4, Vector3, Vector2, Scalar, VectorN];

function from(index: number): AnimationAttributeEnum {
  return _from({ typeList, index }) as AnimationAttributeEnum;
}

function fromString(str: string): AnimationAttributeEnum {
  return _fromString({ typeList, str }) as AnimationAttributeEnum;
}

export const AnimationAttribute = Object.freeze({
  Quaternion,
  Translate,
  Scale,
  Weights,
  Effekseer,
  Vector4,
  Vector3,
  Vector2,
  Scalar,
  VectorN,
  from,
  fromString,
});
