import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface AnimationEnum extends EnumIO {
}

class AnimationClass extends EnumClass implements AnimationEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const Linear: AnimationEnum = new AnimationClass({index:0, str:'Linear'});
const Step: AnimationEnum = new AnimationClass({index:1, str:'Step'});
const CubicSpline: AnimationEnum = new AnimationClass({index:2, str:'CubicSpline'});

const typeList = [ Linear, Step, CubicSpline ];

function from( index : number ): AnimationEnum {
  return _from({typeList, index}) as AnimationEnum;
}

function fromString( str: string ): AnimationEnum {
  return _fromString({typeList, str}) as AnimationEnum;
}

export const Animation = Object.freeze({ Linear, Step, CubicSpline });
