import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface VertexAttributeEnum extends EnumIO {

}
class VertexAttributeClass extends EnumClass implements VertexAttributeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Unknown: VertexAttributeEnum = new VertexAttributeClass({index:-1, str:'UNKNOWN'});
const Position: VertexAttributeEnum = new VertexAttributeClass({index:0, str:'POSITION'});
const Normal: VertexAttributeEnum = new VertexAttributeClass({index:1, str:'NORMAL'});
const Tangent: VertexAttributeEnum = new VertexAttributeClass({index:2, str:'TANGENT'});
const Texcoord0: VertexAttributeEnum = new VertexAttributeClass({index:3, str:'TEXCOORD_0'});
const Texcoord1: VertexAttributeEnum = new VertexAttributeClass({index:4, str:'TEXCOORD_1'});
const Color0: VertexAttributeEnum = new VertexAttributeClass({index:5, str:'COLOR_0'});
const Joints0: VertexAttributeEnum = new VertexAttributeClass({index:6, str:'JOINTS_0'});
const Weights0: VertexAttributeEnum = new VertexAttributeClass({index:7, str:'WEIGHTS_0'});
const Instance: VertexAttributeEnum = new VertexAttributeClass({index:4, str:'INSTANCE'});

const typeList = [Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0];

function from({ index }: { index: number }): VertexAttributeEnum {
  return _from({typeList, index});
}

export const VertexAttribute = Object.freeze({ Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, from });
