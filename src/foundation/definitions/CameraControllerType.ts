
import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface CameraControllerTypeEnum extends EnumIO {
}

class CameraControllerTypeClass extends EnumClass implements CameraControllerTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Orbit: CameraControllerTypeEnum = new CameraControllerTypeClass({index:0, str:'Orbit'});
const WalkThrough: CameraControllerTypeEnum = new CameraControllerTypeClass({index:1, str:'WalkThrough'});

const typeList = [Orbit, WalkThrough];

function from( index : number ): CameraControllerTypeEnum {
  return _from({typeList, index}) as CameraControllerTypeEnum;
}

function fromString( str: string ): CameraControllerTypeEnum {
  return _fromString({typeList, str}) as CameraControllerTypeEnum;
}

export const CameraControllerType = Object.freeze({ Orbit, WalkThrough, from, fromString });
