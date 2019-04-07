import Vector2 from './Vector2';
import Vector4 from './Vector4';
import {IVector3, IVector4} from './IVector';
import {IColorRgb, IColorRgba} from './IColor';
import { CompositionType } from '../definitions/CompositionType';

export default class ColorRgba extends Vector4 implements IVector4, IColorRgba {

  constructor(r:number|TypedArray|Vector4|Array<number>, g?:number, b?:number, a?:number) {
    super(r, g, b, a);
  }

  static get compositionType() {
    return CompositionType.Vec4;
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
