import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface PrimitiveModeEnum extends EnumIO {

}

class PrimitiveModeClass extends EnumClass implements PrimitiveModeEnum {
  constructor({index, str} : {index: number, str: string}) {
    super({index, str});
  }
}

const Points: PrimitiveModeEnum = new PrimitiveModeClass({index:0, str:'POINTS'});
const Lines: PrimitiveModeEnum = new PrimitiveModeClass({index:1, str:'LINES'});
const LineLoop: PrimitiveModeEnum = new PrimitiveModeClass({index:2, str:'LINE_LOOP'});
const LineStrip: PrimitiveModeEnum = new PrimitiveModeClass({index:3, str:'LINE_STRIP'});
const Triangles: PrimitiveModeEnum = new PrimitiveModeClass({index:4, str:'TRIANGLES'});
const TriangleStrip: PrimitiveModeEnum = new PrimitiveModeClass({index:5, str:'TRIANGLE_STRIP'});
const TriangleFan: PrimitiveModeEnum = new PrimitiveModeClass({index:6, str:'TRIANGLE_FAN'});

const typeList = [Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];

function from({ index }: { index: number }): PrimitiveModeEnum {
  return _from({typeList, index});
}

export default Object.freeze({ Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan, from });
