import { EnumClass, EnumIO, _from } from '../misc/EnumIO';

export interface ProcessStageEnum extends EnumIO {
  methodName: string;
}

class ProcessStageClass extends EnumClass implements ProcessStageEnum {
  readonly methodName: string;

  constructor({index, str, methodName} : {index: number, str: string, methodName: string}) {
    super({index, str});

    this.methodName = methodName;
  }
}

const Unknown: ProcessStageEnum = new ProcessStageClass({index:-1, str:'UNKNOWN', methodName: '$unknown'});
const Create: ProcessStageEnum = new ProcessStageClass({index:0, str:'CREATE', methodName: '$create'});
const Load: ProcessStageEnum = new ProcessStageClass({index:1, str:'LOAD', methodName: '$load'});
const Mount: ProcessStageEnum = new ProcessStageClass({index:2, str:'MOUNT', methodName: '$mount'});
const Logic: ProcessStageEnum = new ProcessStageClass({index:3, str:'LOGIC', methodName: '$logic'});
const PreRender: ProcessStageEnum = new ProcessStageClass({index:4, str:'PRE_RENDER', methodName: '$prerender'});
const Render: ProcessStageEnum = new ProcessStageClass({index:5, str:'RENDER', methodName: '$render'});
const Unmount: ProcessStageEnum = new ProcessStageClass({index:6, str:'UNMOUNT', methodName: '$unmount'});
const Discard: ProcessStageEnum = new ProcessStageClass({index:7, str:'DISCARD', methodName: '$discard'})

const typeList = [Unknown, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard];

function from( index : number ): ProcessStageEnum {
  return _from({typeList, index}) as ProcessStageEnum;
}

export const ProcessStage = Object.freeze({ Unknown, Create, Load, Mount, Logic, PreRender, Render, Unmount, Discard, from });
