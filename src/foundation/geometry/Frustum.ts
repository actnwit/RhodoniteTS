import { Vector4 } from '../math/Vector4';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector3 } from '../math/Vector3';
import { Visibility } from '../definitions/Visibility';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { MeshComponent } from '../components';
import { Index } from '../../types';

/**
 * The view frustum class.
 */
export class Frustum {
  public top = MutableVector4.zero();
  public bottom = MutableVector4.zero();
  public right = MutableVector4.zero();
  public left = MutableVector4.zero();
  public zNear = MutableVector4.zero();
  public zFar = MutableVector4.zero();
  private __updated = false;
  private __vp = MutableMatrix44.zero();

  constructor() {}

  /**
   * Updates this view frustum data from the view and projection matrices.
   * @param viewMatrix The view matrix.
   * @param projectionMatrix The projection matrix.
   */
  update(viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    Matrix44.multiplyTo(projectionMatrix, viewMatrix, this.__vp);

    this.zNear.x = this.__vp.m20 + this.__vp.m30;
    this.zNear.y = this.__vp.m21 + this.__vp.m31;
    this.zNear.z = this.__vp.m22 + this.__vp.m32;
    this.zNear.w = this.__vp.m23 + this.__vp.m33;
    this.zNear.normalize3();

    this.zFar.x = -this.__vp.m20 + this.__vp.m30;
    this.zFar.y = -this.__vp.m21 + this.__vp.m31;
    this.zFar.z = -this.__vp.m22 + this.__vp.m32;
    this.zFar.w = -this.__vp.m23 + this.__vp.m33;
    this.zFar.normalize3();

    this.bottom.x = this.__vp.m10 + this.__vp.m30;
    this.bottom.y = this.__vp.m11 + this.__vp.m31;
    this.bottom.z = this.__vp.m12 + this.__vp.m32;
    this.bottom.w = this.__vp.m13 + this.__vp.m33;
    this.bottom.normalize3();

    this.top.x = -this.__vp.m10 + this.__vp.m30;
    this.top.y = -this.__vp.m11 + this.__vp.m31;
    this.top.z = -this.__vp.m12 + this.__vp.m32;
    this.top.w = -this.__vp.m13 + this.__vp.m33;
    this.top.normalize3();

    this.left.x = this.__vp.m00 + this.__vp.m30;
    this.left.y = this.__vp.m01 + this.__vp.m31;
    this.left.z = this.__vp.m02 + this.__vp.m32;
    this.left.w = this.__vp.m03 + this.__vp.m33;
    this.left.normalize3();

    this.right.x = -this.__vp.m00 + this.__vp.m30;
    this.right.y = -this.__vp.m01 + this.__vp.m31;
    this.right.z = -this.__vp.m02 + this.__vp.m32;
    this.right.w = -this.__vp.m03 + this.__vp.m33;
    this.right.normalize3();
  }

  /**
   * false if fully outside, true if inside or intersects
   *
   * original idea is from https://iquilezles.org/articles/frustumcorrect/
   */
  culling(meshComponent: MeshComponent) {
    const aabb = meshComponent.entity.getSceneGraph().worldAABB;

    // check box outside/inside of frustum
    for (let i = 0; i < 6; i++) {
      let out = 0;
      const plane = this.getPlane(i);
      out +=
        plane.x * aabb.minPoint.x +
          plane.y * aabb.minPoint.y +
          plane.z * aabb.minPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.maxPoint.x +
          plane.y * aabb.minPoint.y +
          plane.z * aabb.minPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.minPoint.x +
          plane.y * aabb.maxPoint.y +
          plane.z * aabb.minPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.maxPoint.x +
          plane.y * aabb.maxPoint.y +
          plane.z * aabb.minPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.minPoint.x +
          plane.y * aabb.minPoint.y +
          plane.z * aabb.maxPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.maxPoint.x +
          plane.y * aabb.minPoint.y +
          plane.z * aabb.maxPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.minPoint.x +
          plane.y * aabb.maxPoint.y +
          plane.z * aabb.maxPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      out +=
        plane.x * aabb.maxPoint.x +
          plane.y * aabb.maxPoint.y +
          plane.z * aabb.maxPoint.z +
          plane.w <
        0
          ? 1
          : 0;
      if (out === 8) {
        return false;
      }
    }

    // check frustum outside/inside box
    // let out = 0;
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.x > aabb.maxPoint.x ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.x < aabb.minPoint.x ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.y > aabb.maxPoint.y ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.y < aabb.minPoint.y ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.z > aabb.maxPoint.z ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }
    // out = 0;
    // for (let i = 0; i < 8; i++) {
    //   const plane = this.getPlane(i);
    //   out += plane.z < aabb.minPoint.z ? 1 : 0;
    // }
    // if (out === 8) {
    //   return false;
    // }

    return true;
  }

  getPlane(i: Index) {
    switch (i) {
      case 0:
        return this.top;
      case 1:
        return this.bottom;
      case 2:
        return this.right;
      case 3:
        return this.left;
      case 4:
        return this.zNear;
      case 5:
        return this.zFar;
      default:
        throw new Error('Invalid plane index.');
    }
  }
}
