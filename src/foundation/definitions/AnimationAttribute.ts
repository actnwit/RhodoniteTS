import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface AnimationAttributeEnum extends EnumIO {
}

class AnimationAttributeClass extends EnumClass implements AnimationAttributeEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const Quaternion: AnimationAttributeEnum = new AnimationAttributeClass({index:0, str:'Quaternion'});
const Translate: AnimationAttributeEnum = new AnimationAttributeClass({index:1, str:'Translate'});
const Scale: AnimationAttributeEnum = new AnimationAttributeClass({index:2, str:'Scale'});
const Weights: AnimationAttributeEnum = new AnimationAttributeClass({index:3, str:'Weights'});

const typeList = [ Quaternion, Translate, Scale, Weights ];

function from( index : number ): AnimationAttributeEnum {
  return _from({typeList, index}) as AnimationAttributeEnum;
}

function fromString( str: string ): AnimationAttributeEnum {
  return _fromString({typeList, str}) as AnimationAttributeEnum;
}

export const AnimationAttribute = Object.freeze({ Quaternion, Translate, Scale, Weights, from, fromString });

