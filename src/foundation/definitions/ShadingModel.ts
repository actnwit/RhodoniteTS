import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ShadingModelEnum extends EnumIO {
}

class ShadingModelClass extends EnumClass implements ShadingModelEnum {

  constructor({index, str} : {index: number, str: string}) {
    super({index, str});

  }

}

const Unknown: ShadingModelEnum = new ShadingModelClass({index:-1, str:'UNKNOWN'});
const Constant: ShadingModelEnum = new ShadingModelClass({index:0, str:'CONSTANT'});
const Lambert: ShadingModelEnum = new ShadingModelClass({index:1, str:'LAMBERT'});
const BlinnPhong: ShadingModelEnum = new ShadingModelClass({index:2, str:'BLINN'});
const Phong: ShadingModelEnum = new ShadingModelClass({index:3, str:'PHONG'});

const typeList = [Unknown, Constant, Lambert, BlinnPhong, Phong];

function from( index : number ): ShadingModelEnum {
  return _from({typeList, index}) as ShadingModelEnum;
}

export const ShadingModel = Object.freeze({ Unknown, Constant, Lambert, BlinnPhong, Phong, from });
