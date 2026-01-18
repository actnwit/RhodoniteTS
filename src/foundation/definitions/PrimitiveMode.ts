import { _from, EnumClass, type EnumIO } from '../misc/EnumIO';

export interface PrimitiveModeEnum extends EnumIO {
  getWebGPUTypeStr(): string;
}

class PrimitiveModeClass extends EnumClass implements PrimitiveModeEnum {
  constructor({ index, str }: { index: number; str: string }) {
    super({ index, str });
  }

  getWebGPUTypeStr(): string {
    switch (this.index) {
      case 0:
        return 'point-list';
      case 1:
        return 'line-list';
      case 2:
        throw new Error('Not Supported in WebGPU');
      case 3:
        return 'line-strip';
      case 4:
        return 'triangle-list';
      case 5:
        return 'triangle-strip';
      case 6:
        throw new Error('Not Supported in WebGPU');
      default:
        throw new Error('Not Supported in WebGPU');
    }
  }
}

const Unknown: PrimitiveModeEnum = new PrimitiveModeClass({
  index: -1,
  str: 'UNKNOWN',
});
const Points: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 0,
  str: 'POINTS',
});
const Lines: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 1,
  str: 'LINES',
});
const LineLoop: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 2,
  str: 'LINE_LOOP',
});
const LineStrip: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 3,
  str: 'LINE_STRIP',
});
const Triangles: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 4,
  str: 'TRIANGLES',
});
const TriangleStrip: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 5,
  str: 'TRIANGLE_STRIP',
});
const TriangleFan: PrimitiveModeEnum = new PrimitiveModeClass({
  index: 6,
  str: 'TRIANGLE_FAN',
});

const typeList = [Unknown, Points, Lines, LineLoop, LineStrip, Triangles, TriangleStrip, TriangleFan];

function from(index: number): PrimitiveModeEnum | undefined {
  return _from({ typeList, index }) as PrimitiveModeEnum | undefined;
}

export const PrimitiveMode = Object.freeze({
  Unknown,
  Points,
  Lines,
  LineLoop,
  LineStrip,
  Triangles,
  TriangleStrip,
  TriangleFan,
  from,
});
