import { EnumIO } from "../misc/EnumIO";

export interface PrimitiveModeEnum extends EnumIO {

}

class PrimitiveModeClass implements PrimitiveModeEnum {
  static currentIndex = 0;
  index = PrimitiveModeClass.currentIndex++;
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

const Points: PrimitiveModeEnum = new PrimitiveModeClass({index:0, str:'POINTS'});
const Lines: PrimitiveModeEnum = new PrimitiveModeClass({index:1, str:'LINES'});
const LineLoop: PrimitiveModeEnum = new PrimitiveModeClass({index:2, str:'LINE_LOOP'});
const LineStrip: PrimitiveModeEnum = new PrimitiveModeClass({index:3, str:'LINE_STRIP'});
const Triangles: PrimitiveModeEnum = new PrimitiveModeClass({index:4, str:'TRIANGLES'});
const TriangleStrip: PrimitiveModeEnum = new PrimitiveModeClass({index:5, str:'TRIANGLE_STRIP'});
const TriangleFan: PrimitiveModeEnum = new PrimitiveModeClass({index:6, str:'TRIANGLE_FAN'});

const primitiveMode = [Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];

function from({ index }: { index: number }): PrimitiveModeEnum {
  const match = primitiveMode.find(primitiveMode => primitiveMode.index === index);
  if (!match) {
    throw new Error(`Invalid PrimitiveMode index: [${index}]`);
  }

  return match;
}

export default Object.freeze({ Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan, from });
