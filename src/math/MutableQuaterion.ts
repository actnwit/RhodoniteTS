import ImmutableVector3 from "./ImmutableVector3";
import ImmutableVector4 from "./ImmutableVector4";
import ImmutableQuaternion from "./ImmutableQuaternion";
import Vector4 from "./Vector4";
import ImmutableMatrix44 from "./ImmutableMatrix44";

export default class MutableQuaternion extends ImmutableQuaternion implements Vector4 {

  constructor(x?:number|TypedArray|ImmutableVector3|ImmutableVector4|ImmutableQuaternion|Array<number>|null, y?:number, z?:number, w?:number) {
    super(x, y, z, w);
  }

  static dummy() {
    return new MutableQuaternion(null);
  }

  clone() {
    return new MutableQuaternion(this.x, this.y, this.z, this.w);
  }

  axisAngle(axisVec3:ImmutableVector3, radian:number) {
    var halfAngle = 0.5 * radian;
    var sin = Math.sin(halfAngle);

    var axis = ImmutableVector3.normalize(axisVec3);
    this.w = Math.cos(halfAngle);
    this.x = sin * axis.x;
    this.y = sin * axis.y;
    this.z = sin * axis.z;

    return this;
  }

  add(q:ImmutableQuaternion) {
    this.x += q.x;
    this.y += q.y;
    this.z += q.z;
    this.w += q.w;

    return this;
  }

  multiply(q:ImmutableQuaternion) {
    let result = new ImmutableQuaternion(0, 0, 0, 1);
    result.v[0] =   q.w*this.x + q.z*this.y + q.y*this.z - q.x*this.w;
    result.v[1] = - q.z*this.x + q.w*this.y + q.x*this.z - q.y*this.w;
    result.v[2] =   q.y*this.x + q.x*this.y + q.w*this.z - q.z*this.w;
    result.v[3] = - q.x*this.x - q.y*this.y - q.z*this.z - q.w*this.w;
    this.x = result.x;
    this.y = result.y;
    this.z = result.z;
    this.w = result.w;

    return this;
  }

  fromMatrix(m:ImmutableMatrix44) {

    let tr = m.m00 + m.m11 + m.m22;

    if (tr > 0) {
      let S = 0.5 / Math.sqrt(tr+1.0);
      this.v[0] = (m.m21 - m.m12) * S;
      this.v[1] = (m.m02 - m.m20) * S;
      this.v[2] = (m.m10 - m.m01) * S;
      this.v[3] = 0.25 / S;
    } else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
      let S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      this.v[0] = 0.25 * S;
      this.v[1] = (m.m01 + m.m10) / S;
      this.v[2] = (m.m02 + m.m20) / S;
      this.v[3] = (m.m21 - m.m12) / S;
    } else if (m.m11 > m.m22) {
      let S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      this.v[0] = (m.m01 + m.m10) / S;
      this.v[1] = 0.25 * S;
      this.v[2] = (m.m12 + m.m21) / S;
      this.v[3] = (m.m02 - m.m20) / S;
    } else {
      let S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      this.v[0] = (m.m02 + m.m20) / S;
      this.v[1] = (m.m12 + m.m21) / S;
      this.v[2] = 0.25 * S;
      this.v[3] = (m.m10 - m.m01) / S;
    }

    return this;
  }

  setAt(i: number, val: number) {
    switch (i%4) {
    case 0: this.x = val; break;
    case 1: this.y = val; break;
    case 2: this.z = val; break;
    case 3: this.w = val; break;
    }
  }

  normalize() {
    let norm = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w);
    this.x /= norm;
    this.y /= norm;
    this.z /= norm;
    this.w /= norm;
    return this;
  }

  identity() {
    this.x = 0;
    this.y = 0;
    this.x = 0;
    this.w = 1;
  }

  get x():number {
    return this.v[0];
  }

  set x(x:number) {
    this.v[0] = x;
  }

  get y():number {
    return this.v[1];
  }

  set y(y:number) {
    this.v[1] = y;
  }

  get z():number {
    return this.v[2];
  }

  set z(z:number) {
    this.v[2] = z;
  }

  get w():number {
    return this.v[3];
  }

  set w(w:number) {
    this.v[3] = w;
  }

  get raw() {
    return this.v;
  }
}
