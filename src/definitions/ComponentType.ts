import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ComponentTypeEnum extends EnumIO {
}

class ComponentTypeClass extends EnumClass implements ComponentTypeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Unknown: ComponentTypeEnum = new ComponentTypeClass({index:5119, str:'UNKNOWN'});
const Byte: ComponentTypeEnum = new ComponentTypeClass({index:5120, str:'BYTE'});
const UnsignedByte: ComponentTypeEnum = new ComponentTypeClass({index:5121, str:'UNSIGNED_BYTE'});
const Short: ComponentTypeEnum = new ComponentTypeClass({index:5122, str:'SHORT'});
const UnsignedShort: ComponentTypeEnum = new ComponentTypeClass({index:5123, str:'UNSIGNED_SHORT'});
const Int: ComponentTypeEnum = new ComponentTypeClass({index:5124, str:'INT'});
const UnsingedInt: ComponentTypeEnum = new ComponentTypeClass({index:5125, str:'UNSIGNED_INT'});
const Float: ComponentTypeEnum = new ComponentTypeClass({index:5126, str:'FLOAT'});
const Double: ComponentTypeEnum = new ComponentTypeClass({index:5127, str:'DOUBLE'});

const typeList = [Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double];

function from({ index }: { index: number }): ComponentTypeEnum {
  return _from({typeList, index});
}

export const ComponentType = Object.freeze({ Unknown, Byte, UnsignedByte, Short, UnsignedShort, Int, UnsingedInt, Float, Double, from });
