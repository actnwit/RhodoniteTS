import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';

export type FileTypeEnum = EnumIO;

class FileTypeClass extends EnumClass implements FileTypeEnum {
  readonly extension: string;
  readonly brand: string;
  constructor({
    index,
    str,
    ext,
    brand,
  }: {
    index: number;
    str: string;
    ext: string;
    brand: string;
  }) {
    super({index, str});
    this.extension = ext;
    this.brand = brand;
  }
}

const Unknown: FileTypeEnum = new FileTypeClass({
  index: -1,
  str: 'unknown',
  ext: 'unknown',
  brand: 'UnKnown',
});
const Gltf: FileTypeEnum = new FileTypeClass({
  index: 0,
  str: 'gltf',
  ext: 'gltf',
  brand: 'glTF',
});
const GltfBinary: FileTypeEnum = new FileTypeClass({
  index: 1,
  str: 'glb',
  ext: 'glb',
  brand: 'glTF',
});
const VRM: FileTypeEnum = new FileTypeClass({
  index: 2,
  str: 'vrm',
  ext: 'vrm',
  brand: 'VRM',
});
const Draco: FileTypeEnum = new FileTypeClass({
  index: 3,
  str: 'drc',
  ext: 'drc',
  brand: 'Draco',
});
const EffekseerEffect: FileTypeEnum = new FileTypeClass({
  index: 4,
  str: 'efk',
  ext: 'efk',
  brand: 'EffekseerEffect',
});

const typeList = [Unknown, Gltf, GltfBinary, VRM, Draco, EffekseerEffect];

function from(index: number): FileTypeEnum {
  return _from({typeList, index}) as FileTypeEnum;
}

function fromString(str: string): FileTypeEnum {
  const filetype = _fromString({typeList, str}) as FileTypeEnum;
  if (filetype != null) {
    return filetype;
  } else {
    return Unknown;
  }
}

function isGltfOrGlb(file: FileTypeEnum) {
  if (file === Gltf || file === GltfBinary) {
    return true;
  } else {
    return false;
  }
}

export const FileType = Object.freeze({
  Unknown,
  Gltf,
  GltfBinary,
  VRM,
  Draco,
  EffekseerEffect,
  from,
  fromString,
  isGltfOrGlb,
});
