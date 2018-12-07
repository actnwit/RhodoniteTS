import { EnumIO } from "../misc/EnumIO";

class PrimitiveMode implements EnumIO {
  static currentIndex = 0;
  index = PrimitiveMode.currentIndex++;
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

const Points: PrimitiveMode = new PrimitiveMode({index:0, str:'POINTS'});
const Lines: PrimitiveMode = new PrimitiveMode({index:1, str:'LINES'});
const LineLoop: PrimitiveMode = new PrimitiveMode({index:2, str:'LINE_LOOP'});
const LineStrip: PrimitiveMode = new PrimitiveMode({index:3, str:'LINE_STRIP'});
const Triangles: PrimitiveMode = new PrimitiveMode({index:4, str:'TRIANGLES'});
const TriangleStrip: PrimitiveMode = new PrimitiveMode({index:5, str:'TRIANGLE_STRIP'});
const TriangleFan: PrimitiveMode = new PrimitiveMode({index:6, str:'TRIANGLE_FAN'});
const primitiveMode = [Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];

function from({ index }: { index: number }): PrimitiveMode {
  const match = primitiveMode.find(primitiveMode => primitiveMode.index === index);
  if (!match) {
    throw new Error(`Invalid PrimitiveMode index: [${index}]`);
  }

  return match;
}

export default Object.freeze({ Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan, from });
