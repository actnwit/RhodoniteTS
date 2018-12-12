import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ProcessStageEnum extends EnumIO {

}

class ProcessStageClass extends EnumClass implements ProcessStageEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Unknown: ProcessStageEnum = new ProcessStageClass({index:-1, str:'UNKNOWN'});
const Create: ProcessStageEnum = new ProcessStageClass({index:0, str:'CREATE'});
const Load: ProcessStageEnum = new ProcessStageClass({index:1, str:'LOAD'});
const Mount: ProcessStageEnum = new ProcessStageClass({index:2, str:'MOUNT'});
const Logic: ProcessStageEnum = new ProcessStageClass({index:3, str:'LOGIC'});
const PreRender: ProcessStageEnum = new ProcessStageClass({index:4, str:'PRE_RENDER'});
const Render: ProcessStageEnum = new ProcessStageClass({index:5, str:'RENDER'});
const Unmount: ProcessStageEnum = new ProcessStageClass({index:6, str:'UNMOUNT'});
const Discard: ProcessStageEnum = new ProcessStageClass({index:7, str:'DISCARD'})

const typeList = [Unknown, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard];

function from({ index }: { index: number }): ProcessStageEnum {
  return _from({typeList, index});
}

export const ProcessStage = Object.freeze({ Unknown, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard, from });
