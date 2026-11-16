import { _from, EnumClass, type EnumIO } from '../misc/EnumIO';

export class ProcessApproachClass extends EnumClass implements EnumIO {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }

  get webGLVersion() {
    switch (this) {
      case WebGL2:
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
const WebGL2: ProcessApproachEnum = new ProcessApproachClass({
  index: 2,
  str: 'WebGL2',
});
const WebGPU: ProcessApproachEnum = new ProcessApproachClass({
  index: 3,
  str: 'WebGPU',
});

const typeList = [None, WebGL2, WebGPU];

function from(index: number): ProcessApproachEnum | undefined {
  return _from({ typeList, index }) as ProcessApproachEnum;
}

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
    case WebGL2:
      return true;
    default:
      return false;
  }
};

export const ProcessApproach = Object.freeze({
  isWebGpuApproach,
  None,
  WebGL2,
  WebGPU,
  from,
  isWebGL2Approach,
});
