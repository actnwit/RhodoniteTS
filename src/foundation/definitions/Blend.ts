import { _from, EnumClass, type EnumIO } from '../misc/EnumIO';

export interface BlendEnum extends EnumIO {
  webgpu: string;
}

class BlendClass extends EnumClass implements BlendEnum {
  readonly __webgpu?: string;
  constructor({ index, str, webgpu }: { index: number; str: string; webgpu?: string }) {
    super({ index, str });
    this.__webgpu = webgpu;
  }

  get webgpu(): string {
    if (this.__webgpu === undefined) {
      throw new Error(`does not support ${this.str}`);
    }
    return this.__webgpu;
  }
}

const EquationFuncAdd: BlendEnum = new BlendClass({
  index: 32774,
  str: 'Equation_FUNC_ADD',
  webgpu: 'add',
});
const Zero: BlendEnum = new BlendClass({
  index: 0x0,
  str: 'ZERO',
  webgpu: 'zero',
});
const One: BlendEnum = new BlendClass({
  index: 0x1,
  str: 'ONE',
  webgpu: 'one',
});
const SrcAlpha: BlendEnum = new BlendClass({
  index: 770,
  str: 'SRC_ALPHA',
  webgpu: 'src-alpha',
});
const OneMinusSrcAlpha: BlendEnum = new BlendClass({
  index: 771,
  str: 'ONE_MINUS_SRC_ALPHA',
  webgpu: 'one-minus-src-alpha',
});
const Min: BlendEnum = new BlendClass({
  index: 0x8007,
  str: 'Equation_FUNC_MIN',
  webgpu: 'min',
});
const Max: BlendEnum = new BlendClass({
  index: 0x8008,
  str: 'Equation_FUNC_MAX',
  webgpu: 'max',
});

const typeList = [EquationFuncAdd, Zero, One, SrcAlpha, OneMinusSrcAlpha, Min, Max];

function from(index: number): BlendEnum {
  return _from({ typeList, index }) as BlendEnum;
}

export const Blend = Object.freeze({
  EquationFuncAdd,
  Zero,
  One,
  SrcAlpha,
  OneMinusSrcAlpha,
  Min,
  Max,
  from,
});
