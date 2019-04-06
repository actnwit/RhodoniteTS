import Vector2 from './Vector2';
import Vector4 from './Vector4';
import {IVector3} from './IVector';
import {IColorRgb, IColorRgba} from './IColor';

export default class ColorRgba implements IVector3, IColorRgba {
  v: TypedArray;

  constructor(r?:number|TypedArray|IVector3|Vector4|Array<number>|ColorRgba|null, g?:number, b?:number, a?:number) {
    if (ArrayBuffer.isView(r)) {
      this.v = ((r as any) as TypedArray);
      return;
    } else if (r == null) {
      this.v = new Float32Array(0);
      return;
    } else {
      this.v = new Float32Array(4);
    }

    if (r == null) {
      this.v[0] = 1;
      this.v[1] = 1;
      this.v[2] = 1;
      this.v[3] = 1;
    } else if (Array.isArray(r)) {
      this.v[0] = r[0];
      this.v[1] = r[1];
      this.v[2] = r[2];
      this.v[3] = r[3];
    } else if (typeof (r as any).z !== 'undefined') {
      this.v[0] = (r as any).x;
      this.v[1] = (r as any).y;
      this.v[2] = (r as any).z;
      this.v[3] = (r as any).w;
    } else {
      this.v[0] = ((r as any) as number);
      this.v[1] = ((g as any) as number);
      this.v[2] = ((b as any) as number);
      this.v[3] = ((a as any) as number);
    }

  }

  get x() {
    return this.v[0];
  }

  get y() {
    return this.v[1];
  }

  get z() {
    return this.v[2];
  }

  get w() {
    return this.v[3];
  }

  get r() {
    return this.v[0];
  }

  get g() {
    return this.v[1];
  }

  get b() {
    return this.v[2];
  }

  get a() {
    return this.v[3];
  }
}
