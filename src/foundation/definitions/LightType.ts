import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface LightTypeEnum extends EnumIO {
}

class LightTypeClass extends EnumClass implements LightTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Directional: LightTypeEnum = new LightTypeClass({index:0, str:'Directional'});
const Point: LightTypeEnum = new LightTypeClass({index:1, str:'Point'});
const Spot: LightTypeEnum = new LightTypeClass({index:2, str:'Spot'});
const Ambient: LightTypeEnum = new LightTypeClass({index:3, str:'Ambient'});

const typeList = [Point, Directional, Spot, Ambient];

function from( index : number ): LightTypeEnum {
  return _from({typeList, index}) as LightTypeEnum;
}

function fromString( str: string ): LightTypeEnum {
  return _fromString({typeList, str}) as LightTypeEnum;
}

export const LightType = Object.freeze({ Point, Directional, Spot, Ambient, from, fromString });
