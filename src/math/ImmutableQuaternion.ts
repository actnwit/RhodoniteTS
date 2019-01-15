//import GLBoost from '../../globals';

import Vector3 from './Vector3';
import { IVector4 } from './IVector';
import ImmutableMatrix44 from './ImmutableMatrix44';
import ImmutableVector4 from './ImmutableVector4';
import { CompositionType } from '../definitions/CompositionType';

export default class ImmutableQuaternion implements IVector4 {
  v: TypedArray;

  constructor(x?:number|TypedArray|Vector3|ImmutableVector4|ImmutableQuaternion|Array<number>|null, y?:number, z?:number, w?:number) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new Float32Array(0);
    } else {
      this.v = new Float32Array(4);
    }

    if (!(x != null)) {
      this.v[0] = 0;
      this.v[1] = 0;
      this.v[2] = 0;
      this.v[3] = 1;
    } else if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof (x as any).w !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
      this.v[3] = (x as any).w;
    } else if (typeof (x as any).z !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
      this.v[3] = 1;
    } else if (typeof (x as any).y !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = 0;
      this.v[3] = 1;
    } else {
      this.v[0] = ((x as any) as number);
      this.v[1] = ((y as any) as number);
      this.v[2] = ((z as any) as number);
      this.v[3] = ((w as any) as number);
    }
  }


  isEqual(quat: ImmutableQuaternion) {
    if (this.x === quat.x && this.y === quat.y && this.z === quat.z && this.w === quat.w) {
      return true;
    } else {
      return false;
    }
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  static dummy() {
    return new ImmutableQuaternion(null);
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  get className() {
    return this.constructor.name;
  }

  clone() {
    return new ImmutableQuaternion(this.x, this.y, this.z, this.w);
  }

  static invert(quat: ImmutableQuaternion) {
    quat = new ImmutableQuaternion(-quat.x, -quat.y, -quat.z, quat.w);
    const inorm2 = 1.0/(quat.x*quat.x + quat.y*quat.y + quat.z*quat.z + quat.w*quat.w);
    quat.v[0] *= inorm2;
    quat.v[1] *= inorm2;
    quat.v[2] *= inorm2;
    quat.v[3] *= inorm2;
    return quat;
  }

  static qlerp(lhq: ImmutableQuaternion, rhq: ImmutableQuaternion, ratio:number) {

    var q = new ImmutableQuaternion(0, 0, 0, 1);
    var qr = lhq.w * rhq.w + lhq.x * rhq.x + lhq.y * rhq.y + lhq.z * rhq.z;
    var ss = 1.0 - qr * qr;

    if (ss === 0.0) {
      q.v[3] = lhq.w;
      q.v[0] = lhq.x;
      q.v[1] = lhq.y;
      q.v[2] = lhq.z;

      return q;
    } else {

      if (qr > 1) {
        qr = 0.999;
      } else if (qr < -1) {
        qr = -0.999;
      }

      let ph = Math.acos(qr);
      let s2;
      if(qr < 0.0 && ph > Math.PI / 2.0){
        qr = - lhq.w * rhq.w - lhq.x * rhq.x - lhq.y * rhq.y - lhq.z * rhq.z;
        ph = Math.acos(qr);
        s2 = -1 * Math.sin(ph * ratio) / Math.sin(ph);
      } else {
        s2 = Math.sin(ph * ratio) / Math.sin(ph);
      }
      let s1 = Math.sin(ph * (1.0 - ratio)) / Math.sin(ph);

      q.v[0] = lhq.x * s1 + rhq.x * s2;
      q.v[1] = lhq.y * s1 + rhq.y * s2;
      q.v[2] = lhq.z * s1 + rhq.z * s2;
      q.v[3] = lhq.w * s1 + rhq.w * s2;

      return q;
    }
  }

  static axisAngle(axisVec3: Vector3, radian: number) {
    var halfAngle = 0.5 * radian;
    var sin = Math.sin(halfAngle);

    var axis = Vector3.normalize(axisVec3);
    return new ImmutableQuaternion(
      sin * axis.x,
      sin * axis.y,
      sin * axis.z,
      Math.cos(halfAngle));
  }

  static multiply(q1:ImmutableQuaternion, q2:ImmutableQuaternion) {
    let result = new ImmutableQuaternion(0, 0, 0, 1);
    result.v[0] =   q2.w*q1.x + q2.z*q1.y - q2.y*q1.z + q2.x*q1.w;
    result.v[1] = - q2.z*q1.x + q2.w*q1.y + q2.x*q1.z + q2.y*q1.w;
    result.v[2] =   q2.y*q1.x - q2.x*q1.y + q2.w*q1.z + q2.z*q1.w;
    result.v[3] = - q2.x*q1.x - q2.y*q1.y - q2.z*q1.z + q2.w*q1.w;
    return result;
  }

  static fromMatrix(m:ImmutableMatrix44) {

    let q = new ImmutableQuaternion();
    let tr = m.m00 + m.m11 + m.m22;

    if (tr > 0) {
      let S = 0.5 / Math.sqrt(tr+1.0);
      q.v[3] = 0.25 / S;
      q.v[0] = (m.m21 - m.m12) * S;
      q.v[1] = (m.m02 - m.m20) * S;
      q.v[2] = (m.m10 - m.m01) * S;
    } else if ((m.m00 > m.m11) && (m.m00 > m.m22)) {
      let S = Math.sqrt(1.0 + m.m00 - m.m11 - m.m22) * 2;
      q.v[3] = (m.m21 - m.m12) / S;
      q.v[0] = 0.25 * S;
      q.v[1] = (m.m01 + m.m10) / S;
      q.v[2] = (m.m02 + m.m20) / S;
    } else if (m.m11 > m.m22) {
      let S = Math.sqrt(1.0 + m.m11 - m.m00 - m.m22) * 2;
      q.v[3] = (m.m02 - m.m20) / S;
      q.v[0] = (m.m01 + m.m10) / S;
      q.v[1] = 0.25 * S;
      q.v[2] = (m.m12 + m.m21) / S;
    } else {
      let S = Math.sqrt(1.0 + m.m22 - m.m00 - m.m11) * 2;
      q.v[3] = (m.m10 - m.m01) / S;
      q.v[0] = (m.m02 + m.m20) / S;
      q.v[1] = (m.m12 + m.m21) / S;
      q.v[2] = 0.25 * S;
    }

    return q;
  }

  static fromPosition(vec3: Vector3) {
    let q = new ImmutableQuaternion(vec3.x, vec3.y, vec3.z, 0);
    return q;
  }

  at(i: number) {
    switch (i%4) {
    case 0: return this.x;
    case 1: return this.y;
    case 2: return this.z;
    case 3: return this.w;
    }
  }


  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
  }

  get x():number {
    return this.v[0];
  }

  get y():number {
    return this.v[1];
  }

  get z():number {
    return this.v[2];
  }

  get w():number {
    return this.v[3];
  }

}

