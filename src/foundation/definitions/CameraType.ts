import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface CameraTypeEnum extends EnumIO {
}

class CameraTypeClass extends EnumClass implements CameraTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Perspective: CameraTypeEnum = new CameraTypeClass({index:0, str:'Perspective'});
const Orthographic: CameraTypeEnum = new CameraTypeClass({index:1, str:'Orthographic'});
const Frustom: CameraTypeEnum = new CameraTypeClass({index:2, str:'Frustom'});

const typeList = [Perspective, Orthographic, Frustom];

function from( index : number ): CameraTypeEnum {
  return _from({typeList, index}) as CameraTypeEnum;
}

function fromString( str: string ): CameraTypeEnum {
  return _fromString({typeList, str}) as CameraTypeEnum;
}

export const CameraType = Object.freeze({ Perspective, Orthographic, Frustom, from, fromString });
