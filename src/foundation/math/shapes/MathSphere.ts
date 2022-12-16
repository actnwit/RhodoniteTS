import { FloatTypedArrayConstructor } from '../../../types/CommonTypes';
import { IMutableVector3, IVector3 } from '../IVector';
import { MutableVector3_ } from '../MutableVector3';
import { Vector3_ } from '../Vector3';

export class MathSphere_<T extends FloatTypedArrayConstructor> {
  private __position: MutableVector3_<T>;
  private __radius: number;
  private __type: FloatTypedArrayConstructor;

  constructor(position: IMutableVector3, radius: number) {
    this.__position = position;
    this.__radius = radius;
    if (this.__position.bytesPerComponent === 4) {
      this.__type = Float32Array;
    } else {
      this.__type = Float64Array;
    }
  }

  get position() {
    return this.__position;
  }

  get radius() {
    return this.__radius;
  }

  calcCollision(rayPos: IVector3, rayDir: IVector3): boolean {
    const m = Vector3_._subtract(rayPos, this.__position, this.__type);
    const b = Vector3_.dot(m, rayDir);
    const c = Vector3_.dot(m, m) - this.__radius * this.__radius;

    if (c > 0 && b > 0) {
      return false;
    }

    const discR = b * b - c;
    if (discR < 0) {
      return false;
    }

    return true;
  }
}

export class MathSphere extends MathSphere_<Float32ArrayConstructor> {}
export class MathSphereD extends MathSphere_<Float64ArrayConstructor> {}
export type MathSphereF = MathSphere;
