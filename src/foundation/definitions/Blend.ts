import { EnumClass, EnumIO, _from } from '../misc/EnumIO';

export type BlendEnum = EnumIO;

class BlendClass extends EnumClass implements BlendEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }
}

const EquationFuncAdd: BlendEnum = new BlendClass({
  index: 32774,
  str: 'Equation_FUNC_ADD',
});
const One: BlendEnum = new BlendClass({
  index: 0x1,
  str: 'ONE',
});
const SrcAlpha: BlendEnum = new BlendClass({
  index: 770,
  str: 'ONE_ALPHA',
});
const OneMinusSrcAlpha: BlendEnum = new BlendClass({
  index: 771,
  str: 'ONE_MINUS_SRC_ALPHA',
});

const typeList = [EquationFuncAdd, One, SrcAlpha, OneMinusSrcAlpha];

function from(index: number): BlendEnum {
  return _from({ typeList, index }) as BlendEnum;
}

export const Blend = Object.freeze({
  EquationFuncAdd,
  One,
  SrcAlpha,
  OneMinusSrcAlpha,
  from,
});
