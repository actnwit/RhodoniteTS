import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ProcessApproachEnum extends EnumIO {

}

class ProcessApproachClass extends EnumClass implements ProcessApproachEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const None: ProcessApproachEnum = new ProcessApproachClass({index:0, str:'NONE'});
const UniformWebGL1: ProcessApproachEnum = new ProcessApproachClass({index:1, str:'UNIFORM_WEBGL1'});
const DataTextureWebGL1: ProcessApproachEnum = new ProcessApproachClass({index:2, str:'DATA_TEXTURE_WEBGL1'});
const DataTextureWebGL2: ProcessApproachEnum = new ProcessApproachClass({index:3, str:'DATA_TEXTURE_WEBGL2'});
const UBOWebGL2: ProcessApproachEnum = new ProcessApproachClass({index:4, str:'UBO_WEBGL2'});
const TransformFeedbackWebGL2: ProcessApproachEnum = new ProcessApproachClass({index:5, str:'TRNASFORM_FEEDBACK_WEBGL2'});

const typeList = [ None, UniformWebGL1, DataTextureWebGL1, DataTextureWebGL2, UBOWebGL2, TransformFeedbackWebGL2 ];

function from({ index }: { index: number }): ProcessApproachEnum {
  return _from({typeList, index});
}

export const ProcessApproach = Object.freeze({ None, UniformWebGL1, DataTextureWebGL1, DataTextureWebGL2, UBOWebGL2, TransformFeedbackWebGL2 });
