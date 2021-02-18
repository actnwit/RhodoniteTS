import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type CameraTypeEnum = EnumIO;

class CameraTypeClass extends EnumClass implements CameraTypeEnum {
  constructor({index, str}: {index: number; str: string}) {
    super({index, str});
  }
}

const Perspective: CameraTypeEnum = new CameraTypeClass({
  index: 0,
  str: 'Perspective',
});
const Orthographic: CameraTypeEnum = new CameraTypeClass({
  index: 1,
  str: 'Orthographic',
});
const Frustum: CameraTypeEnum = new CameraTypeClass({index: 2, str: 'Frustum'});

const typeList = [Perspective, Orthographic, Frustum];

function from(index: number): CameraTypeEnum {
  return _from({typeList, index}) as CameraTypeEnum;
}

function fromString(str: string): CameraTypeEnum {
  return _fromString({typeList, str}) as CameraTypeEnum;
}

export const CameraType = Object.freeze({
  Perspective,
  Orthographic,
  Frustum,
  from,
  fromString,
});
