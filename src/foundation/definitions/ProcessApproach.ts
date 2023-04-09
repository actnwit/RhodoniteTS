import { EnumClass, EnumIO, _from } from '../misc/EnumIO';

export class ProcessApproachClass extends EnumClass implements EnumIO {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }

  get webGLVersion() {
    switch (this) {
      case Uniform:
      case DataTexture:
        return 2;
      default:
        return 0;
    }
  }
}

export type ProcessApproachEnum = ProcessApproachClass;

const None: ProcessApproachEnum = new ProcessApproachClass({
  index: 0,
  str: 'NONE',
});
const Uniform: ProcessApproachEnum = new ProcessApproachClass({
  index: 1,
  str: 'UNIFORM',
});
const DataTexture: ProcessApproachEnum = new ProcessApproachClass({
  index: 2,
  str: 'DataTexture',
});
const WebGPU: ProcessApproachEnum = new ProcessApproachClass({
  index: 3,
  str: 'WebGPU',
});

const typeList = [None, Uniform, DataTexture];

function from(index: number): ProcessApproachEnum | undefined {
  return _from({ typeList, index }) as ProcessApproachEnum;
}

const isDataTextureApproach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case DataTexture:
      return true;
    default:
      return false;
  }
};

const isUniformApproach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case Uniform:
      return true;
    default:
      return false;
  }
};

const isWebGpuApproach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case WebGPU:
      return true;
    default:
      return false;
  }
};

const isWebGL2Approach = (processApproach: ProcessApproachEnum) => {
  switch (processApproach) {
    case Uniform:
    case DataTexture:
      return true;
    default:
      return false;
  }
};

export const ProcessApproach = Object.freeze({
  isDataTextureApproach,
  isUniformApproach,
  isWebGpuApproach,
  None,
  Uniform,
  DataTexture,
  WebGPU,
  isWebGL2Approach,
});
