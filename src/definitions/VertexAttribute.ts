import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";

export interface VertexAttributeEnum extends EnumIO {
  getAttributeSlot(): Index;
}
class VertexAttributeClass extends EnumClass implements VertexAttributeEnum {
  private __attributeSlot: Index;
  constructor({index, str, attributeSlot} : {index: number, str: string, attributeSlot: Index}) {
    super({index, str});
    this.__attributeSlot = attributeSlot;
  }

  getAttributeSlot(): Index {
    return this.__attributeSlot;
  }
}

const Unknown: VertexAttributeEnum = new VertexAttributeClass({index:-1, str:'UNKNOWN', attributeSlot: -1});
const Position: VertexAttributeEnum = new VertexAttributeClass({index:0, str:'POSITION', attributeSlot: 0});
const Normal: VertexAttributeEnum = new VertexAttributeClass({index:1, str:'NORMAL', attributeSlot: 1});
const Tangent: VertexAttributeEnum = new VertexAttributeClass({index:2, str:'TANGENT', attributeSlot: 2});
const Texcoord0: VertexAttributeEnum = new VertexAttributeClass({index:3, str:'TEXCOORD_0', attributeSlot: 3});
const Texcoord1: VertexAttributeEnum = new VertexAttributeClass({index:4, str:'TEXCOORD_1', attributeSlot: 4});
const Color0: VertexAttributeEnum = new VertexAttributeClass({index:5, str:'COLOR_0', attributeSlot: 5});
const Joints0: VertexAttributeEnum = new VertexAttributeClass({index:6, str:'JOINTS_0', attributeSlot: 6});
const Weights0: VertexAttributeEnum = new VertexAttributeClass({index:7, str:'WEIGHTS_0', attributeSlot: 7});
const Instance: VertexAttributeEnum = new VertexAttributeClass({index:8, str:'INSTANCE', attributeSlot: 4});

const typeList = [ Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance ];

function from({ index, str }: { index?: number, str?: string }): VertexAttributeEnum {
  if (index != null) {
    return _from({typeList, index}) as VertexAttributeEnum;
  } else if (str != null) {
    return _fromString({typeList, str}) as VertexAttributeEnum;
  } else {
    throw new Error('Not currect query supplied.');
  }
}

export const VertexAttribute = Object.freeze({
  Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance, from
});
