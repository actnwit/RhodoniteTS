import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { Index } from "../../commontypes/CommonTypes";

export interface VertexAttributeEnum extends EnumIO {
  getAttributeSlot(): Index;
  shaderStr: string;
}
export class VertexAttributeClass extends EnumClass implements VertexAttributeEnum {
  private __attributeSlot: Index;
  private __shaderStr: string;
  constructor({index, str, shaderStr, attributeSlot} : {index: number, str: string, shaderStr: string, attributeSlot: Index}) {
    super({index, str});
    this.__attributeSlot = attributeSlot;
    this.__shaderStr = shaderStr;
  }

  getAttributeSlot(): Index {
    return this.__attributeSlot;
  }

  get shaderStr() {
    return this.__shaderStr;
  }
}

const Unknown: VertexAttributeEnum = new VertexAttributeClass({index:-1, str:'UNKNOWN', shaderStr: 'a_unknown', attributeSlot: -1});
const Position: VertexAttributeEnum = new VertexAttributeClass({index:0, str:'POSITION', shaderStr: 'a_position', attributeSlot: 0});
const Normal: VertexAttributeEnum = new VertexAttributeClass({index:1, str:'NORMAL', shaderStr: 'a_normal', attributeSlot: 1});
const Tangent: VertexAttributeEnum = new VertexAttributeClass({index:2, str:'TANGENT', shaderStr: 'a_tangent', attributeSlot: 2});
const Texcoord0: VertexAttributeEnum = new VertexAttributeClass({index:3, str:'TEXCOORD_0', shaderStr: 'a_texcoord_0', attributeSlot: 3});
const Texcoord1: VertexAttributeEnum = new VertexAttributeClass({index:4, str:'TEXCOORD_1', shaderStr: 'a_texcoord_1', attributeSlot: 4});
const Color0: VertexAttributeEnum = new VertexAttributeClass({index:5, str:'COLOR_0', shaderStr: 'a_color_0', attributeSlot: 5});
const Joints0: VertexAttributeEnum = new VertexAttributeClass({index:6, str:'JOINTS_0', shaderStr: 'a_joints_0', attributeSlot: 6});
const Weights0: VertexAttributeEnum = new VertexAttributeClass({index:7, str:'WEIGHTS_0', shaderStr: 'a_weights_0', attributeSlot: 7});
const Instance: VertexAttributeEnum = new VertexAttributeClass({index:8, str:'INSTANCE', shaderStr: 'a_instance', attributeSlot: 8});
const FaceNormal: VertexAttributeEnum = new VertexAttributeClass({index:9, str:'FACE_NORMAL', shaderStr: 'a_faceNormal', attributeSlot: 9});
const BaryCentricCoord: VertexAttributeEnum = new VertexAttributeClass({index:10, str:'BARY_CENTRIC_COORD', shaderStr: 'a_baryCentricCoord', attributeSlot: 10});

const typeList = [ Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance, FaceNormal, BaryCentricCoord ];

const AttributeTypeNumber = 11;

function from( index : number ): VertexAttributeEnum {
  return _from({typeList, index}) as VertexAttributeEnum;
}

function fromString( str: string ): VertexAttributeEnum {
  let newStr = str;
  if (str === 'COLOR') {
    newStr = 'COLOR_0';
  } else if (str === 'TEXCOORD') {
    newStr = 'TEXCOORD_0';
  } else if (str ==='JOINTS') {
    newStr = 'JOINTS_0';
  } else if (str ==='WEIGHTS') {
    newStr = 'WEIGHTS_0';
  }
  return _fromString({typeList, str:newStr}) as VertexAttributeEnum;
}

export const VertexAttribute = Object.freeze({
  Unknown, Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, Instance, FaceNormal, BaryCentricCoord, AttributeTypeNumber: AttributeTypeNumber, from, fromString
});
