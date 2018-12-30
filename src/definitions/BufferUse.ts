import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface BufferUseEnum extends EnumIO {
}

class BufferUseClass extends EnumClass implements BufferUseEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const GPUInstanceData: BufferUseEnum = new BufferUseClass({index:0, str:'GPUInstanceData'});
const GPUVertexData: BufferUseEnum = new BufferUseClass({index:1, str:'GPUVertexData'});
const CPUGeneric: BufferUseEnum = new BufferUseClass({index:2, str:'CPUGeneric'});

const typeList = [ GPUInstanceData, GPUVertexData, CPUGeneric ];

function from({ index, str }: { index?: number, str?: string }): BufferUseEnum {
  if (index != null) {
    return _from({typeList, index}) as BufferUseEnum;
  } else if (str != null) {
    return _fromString({typeList, str}) as BufferUseEnum;
  } else {
    throw new Error('Not currect query supplied.');
  }

}

export const BufferUse = Object.freeze({ GPUInstanceData, GPUVertexData, CPUGeneric, from });
