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
const UBOGeneric: BufferUseEnum = new BufferUseClass({index:2, str:'UBOGeneric'});
const CPUGeneric: BufferUseEnum = new BufferUseClass({index:3, str:'CPUGeneric'});

const typeList = [ GPUInstanceData, GPUVertexData, UBOGeneric, CPUGeneric ];

function from( index : number ): BufferUseEnum {
  return _from({typeList, index}) as BufferUseEnum;
}

function fromString( str: string ): BufferUseEnum {
  return _fromString({typeList, str}) as BufferUseEnum;
}

export const BufferUse = Object.freeze({ GPUInstanceData, GPUVertexData, UBOGeneric, CPUGeneric, from, fromString });
