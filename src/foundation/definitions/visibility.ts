import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface VisibilityEnum extends EnumIO {
}

class VisibilityClass extends EnumClass implements VisibilityEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Neutral: VisibilityEnum = new VisibilityClass({index:0, str:'Neutral'});
const Visible: VisibilityEnum = new VisibilityClass({index:1, str:'Visible'});
const Invisible: VisibilityEnum = new VisibilityClass({index:-1, str:'Invisible'});

const typeList = [Visible, Invisible, Neutral];

function from( index : number ): VisibilityEnum {
  return _from({typeList, index}) as VisibilityEnum;
}

function fromString( str: string ): VisibilityEnum {
  return _fromString({typeList, str}) as VisibilityEnum;
}

export const Visibility = Object.freeze({Visible, Invisible, Neutral, from, fromString });
