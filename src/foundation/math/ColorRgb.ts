//import GLBoost from './../../globals';
import Vector2 from './Vector2';
import Vector4 from './Vector4';
import {IVector3} from './IVector';
import {IColorRgb} from './IColor';
import { TypedArray } from '../../types/CommonTypes';

export default class ColorRgb implements IVector3, IColorRgb {
  v: TypedArray;

  constructor(r?:number|TypedArray|IVector3|Vector4|Array<number>|ColorRgb|null, g?:number, b?:number) {
    if (ArrayBuffer.isView(r)) {
      this.v = ((r as any) as TypedArray);
      return;
    } else if (r == null) {
      this.v = new Float32Array(0);
      return;
    } else {
      this.v = new Float32Array(3);
    }

    if (r == null) {
      this.v[0] = 1;
      this.v[1] = 1;
      this.v[2] = 1;
    } else if (Array.isArray(r)) {
      this.v[0] = r[0];
      this.v[1] = r[1];
      this.v[2] = r[2];
    } else if (typeof (r as any).z !== 'undefined') {
      this.v[0] = (r as any).x;
      this.v[1] = (r as any).y;
      this.v[2] = (r as any).z;
    } else {
      this.v[0] = ((r as any) as number);
      this.v[1] = ((g as any) as number);
      this.v[2] = ((b as any) as number);
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
    return 1;
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
    return 1;
  }
}
