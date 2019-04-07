import Vector2 from './Vector2';
import Vector4 from './Vector4';
import {IVector3} from './IVector';
import {IColorRgb} from './IColor';
import { CompositionType } from '../definitions/CompositionType';
import Vector3 from './Vector3';

export default class ColorRgb extends Vector3 implements IVector3, IColorRgb {

  constructor(r?:number|TypedArray|IVector3|Vector4|Array<number>|ColorRgb|null, g?:number, b?:number) {
    super(r, g, b);
  }

  static get compositionType() {
    return CompositionType.Vec3;
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
