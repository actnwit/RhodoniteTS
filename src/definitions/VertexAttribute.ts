import { EnumIO } from "../misc/EnumIO";

export interface VertexAttributeEnum extends EnumIO {

}

class VertexAttributeClass implements VertexAttributeEnum {
  static currentIndex = 0;
  index = VertexAttributeClass.currentIndex++;
  readonly str: string;

  constructor({index, str} : {index: number, str: string}) {
    this.index = index;
    this.str = str;
  }

  toString(): string {
    return this.str;
  }

  toJSON(): number {
    return this.index;
  }
}

const Position: VertexAttributeEnum = new VertexAttributeClass({index:0, str:'POSITION'});
const Normal: VertexAttributeEnum = new VertexAttributeClass({index:1, str:'NORMAL'});
const Tangent: VertexAttributeEnum = new VertexAttributeClass({index:2, str:'TANGENT'});
const Texcoord0: VertexAttributeEnum = new VertexAttributeClass({index:3, str:'TEXCOORD_0'});
const Texcoord1: VertexAttributeEnum = new VertexAttributeClass({index:4, str:'TEXCOORD_1'});
const Color0: VertexAttributeEnum = new VertexAttributeClass({index:5, str:'COLOR_0'});
const Joints0: VertexAttributeEnum = new VertexAttributeClass({index:6, str:'JOINTS_0'});
const Weights0: VertexAttributeEnum = new VertexAttributeClass({index:7, str:'WEIGHTS_0'});


const vertexAttribute = [Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0];

function from({ index }: { index: number }): VertexAttributeEnum {
  const match = vertexAttribute.find(attribute => attribute.index === index);
  if (!match) {
    throw new Error(`Invalid PrimitiveMode index: [${index}]`);
  }

  return match;
}

export default Object.freeze({ Position, Normal, Tangent, Texcoord0, Texcoord1, Color0, Joints0, Weights0, from });
