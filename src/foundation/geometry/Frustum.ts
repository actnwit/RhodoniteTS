import Vector4 from "../math/Vector4";
import Matrix44 from "../math/Matrix44";
import MutableMatrix44 from "../math/MutableMatrix44";
import MutableVector4 from "../math/MutableVector4";
import Vector3 from "../math/Vector3";
import Entity from "../core/Entity";
import { Visibility } from "../definitions/visibility";
import SceneGraphComponent from "../components/SceneGraphComponent";
import AABB from "../math/AABB";

/**
 * The view frustum class.
 */
export default class Frustum {
  public top = MutableVector4.zero();
  public bottom = MutableVector4.zero();
  public right = MutableVector4.zero();
  public left = MutableVector4.zero();
  public zNear = MutableVector4.zero();
  public zFar = MutableVector4.zero();
  private __updated = false;
  private __vp = MutableMatrix44.zero();

  constructor() {

  }

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

    this.zFar.x = - this.__vp.m20 + this.__vp.m30;
    this.zFar.y = - this.__vp.m21 + this.__vp.m31;
    this.zFar.z = - this.__vp.m22 + this.__vp.m32;
    this.zFar.w = - this.__vp.m23 + this.__vp.m33;
    this.zFar.normalize3();

    this.bottom.x = this.__vp.m10 + this.__vp.m30;
    this.bottom.y = this.__vp.m11 + this.__vp.m31;
    this.bottom.z = this.__vp.m12 + this.__vp.m32;
    this.bottom.w = this.__vp.m13 + this.__vp.m33;
    this.bottom.normalize3();

    this.top.x = - this.__vp.m10 + this.__vp.m30;
    this.top.y = - this.__vp.m11 + this.__vp.m31;
    this.top.z = - this.__vp.m12 + this.__vp.m32;
    this.top.w = - this.__vp.m13 + this.__vp.m33;
    this.top.normalize3();

    this.left.x = this.__vp.m00 + this.__vp.m30;
    this.left.y = this.__vp.m01 + this.__vp.m31;
    this.left.z = this.__vp.m02 + this.__vp.m32;
    this.left.w = this.__vp.m03 + this.__vp.m33;
    this.left.normalize3();

    this.right.x = - this.__vp.m00 + this.__vp.m30;
    this.right.y = - this.__vp.m01 + this.__vp.m31;
    this.right.z = - this.__vp.m02 + this.__vp.m32;
    this.right.w = - this.__vp.m03 + this.__vp.m33;
    this.right.normalize3();

  }

  /**
   * Do clipping test (Inside / outside / neutral) of the plane of the view frustum.
   * @param plane The plane of the view frustum.
   * @param point The point to test.
   * @param bias The bias value.
   */
  clipping(plane: Vector4, point: Vector3, bias: number) {
    const dot = Vector3.dotProduct(plane as any as Vector3, point);
    const d = dot + plane.w;
    if (d + bias < 0) {
      return Visibility.Invisible; // outside completely
    } else if (d - bias > 0) {
      return Visibility.Visible; // inside completely
    } else {
      return Visibility.Neutral; // neutral
    }
  }

  /**
   * Do culling test (Inside / outside / neutral) of the entity against to the view frustum.
   * @param sg The SceneGraphComponent object of the entity.
   */
  culling(sg: SceneGraphComponent) {
    const aabb = sg.worldAABB;
    const center = aabb.centerPoint;
    const centerToCorner = aabb.lengthCenterToCorner;


    const right = this.clipping(this.right, center, centerToCorner);
    const left = this.clipping(this.left, center, centerToCorner);
    if (right === Visibility.Invisible && left === Visibility.Visible || right === Visibility.Visible && left === Visibility.Invisible) {
      return Visibility.Invisible;
    }
    const zNear = this.clipping(this.zNear, center, centerToCorner);
    const zFar = this.clipping(this.zFar, center, centerToCorner);
    if (zNear === Visibility.Invisible && zFar === Visibility.Visible || zNear === Visibility.Visible && zFar === Visibility.Invisible) {
      return Visibility.Invisible;
    }
    const top = this.clipping(this.top, center, centerToCorner);
    const bottom = this.clipping(this.bottom, center, centerToCorner);
    if (top === Visibility.Invisible && bottom === Visibility.Visible || top === Visibility.Visible && bottom === Visibility.Invisible) {
      return Visibility.Invisible;
    }

    const sum = top.index + bottom.index + right.index + left.index + zNear.index + zFar.index;
    if (sum === 6) {
      return Visibility.Visible;
    }

    return Visibility.Neutral;
  }
}
