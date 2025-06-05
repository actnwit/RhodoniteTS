import { Vector4 } from '../math/Vector4';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { MutableVector4 } from '../math/MutableVector4';
import { MeshComponent } from '../components/Mesh/MeshComponent';
import { Index } from '../../types/CommonTypes';

/**
 * The view frustum class.
 * Represents a truncated pyramid (frustum) used for view culling in 3D graphics.
 * Contains six planes (top, bottom, left, right, near, far) and eight corner vertices.
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
  private __invProjMat = MutableMatrix44.zero();
  private __invViewMat = MutableMatrix44.zero();
  private __tmp_vec4_0 = MutableVector4.zero();
  private __tmp_vec4_1 = MutableVector4.zero();
  private __tmp_vec4_array = [
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
    MutableVector4.zero(),
  ];
  private __hCorners = [
    // near
    Vector4.fromCopy4(-1, 1, 1, 1),
    Vector4.fromCopy4(1, 1, 1, 1),
    Vector4.fromCopy4(1, -1, 1, 1),
    Vector4.fromCopy4(-1, -1, 1, 1),
    // far
    Vector4.fromCopy4(-1, 1, -1, 1),
    Vector4.fromCopy4(1, 1, -1, 1),
    Vector4.fromCopy4(1, -1, -1, 1),
    Vector4.fromCopy4(-1, -1, -1, 1),
  ];

  public corners: Vector4[] = [];

  /**
   * Creates a new Frustum instance.
   * Initializes all planes and corner arrays with default values.
   */
  constructor() {}

  /**
   * Updates this view frustum data from the view and projection matrices.
   * Calculates the six frustum planes and eight corner vertices in world space.
   * This method should be called whenever the camera's view or projection matrix changes.
   *
   * @param viewMatrix - The view matrix that transforms from world space to view space
   * @param projectionMatrix - The projection matrix that transforms from view space to clip space
   *
   * @remarks
   * The frustum planes are calculated using the combined view-projection matrix.
   * Corner vertices are computed by transforming normalized device coordinates back to world space.
   * The planes are stored as Vector4 where (x,y,z) is the normal and w is the distance from origin.
   */
  update(viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    // Calculate the planes of the view frustum.
    Matrix44.multiplyTo(projectionMatrix, viewMatrix, this.__vp);

    this.zNear.x = this.__vp.m20 + this.__vp.m30;
    this.zNear.y = this.__vp.m21 + this.__vp.m31;
    this.zNear.z = this.__vp.m22 + this.__vp.m32;
    this.zNear.w = this.__vp.m23 + this.__vp.m33;
    // this.zNear.normalize3();

    this.zFar.x = -this.__vp.m20 + this.__vp.m30;
    this.zFar.y = -this.__vp.m21 + this.__vp.m31;
    this.zFar.z = -this.__vp.m22 + this.__vp.m32;
    this.zFar.w = -this.__vp.m23 + this.__vp.m33;
    // this.zFar.normalize3();

    this.bottom.x = this.__vp.m10 + this.__vp.m30;
    this.bottom.y = this.__vp.m11 + this.__vp.m31;
    this.bottom.z = this.__vp.m12 + this.__vp.m32;
    this.bottom.w = this.__vp.m13 + this.__vp.m33;
    // this.bottom.normalize3();

    this.top.x = -this.__vp.m10 + this.__vp.m30;
    this.top.y = -this.__vp.m11 + this.__vp.m31;
    this.top.z = -this.__vp.m12 + this.__vp.m32;
    this.top.w = -this.__vp.m13 + this.__vp.m33;
    // this.top.normalize3();

    this.left.x = this.__vp.m00 + this.__vp.m30;
    this.left.y = this.__vp.m01 + this.__vp.m31;
    this.left.z = this.__vp.m02 + this.__vp.m32;
    this.left.w = this.__vp.m03 + this.__vp.m33;
    // this.left.normalize3();

    this.right.x = -this.__vp.m00 + this.__vp.m30;
    this.right.y = -this.__vp.m01 + this.__vp.m31;
    this.right.z = -this.__vp.m02 + this.__vp.m32;
    this.right.w = -this.__vp.m03 + this.__vp.m33;
    // this.right.normalize3();

    // Calculate the corners of the view frustum.
    Matrix44.invertTo(projectionMatrix, this.__invProjMat);
    Matrix44.invertTo(viewMatrix, this.__invViewMat);
    for (let i = 0; i < 8; i++) {
      this.__invProjMat.multiplyVectorTo(this.__hCorners[i], this.__tmp_vec4_0);
      this.__tmp_vec4_1.x = this.__tmp_vec4_0.x / this.__tmp_vec4_0.w;
      this.__tmp_vec4_1.y = this.__tmp_vec4_0.y / this.__tmp_vec4_0.w;
      this.__tmp_vec4_1.z = this.__tmp_vec4_0.z / this.__tmp_vec4_0.w;
      this.__tmp_vec4_1.w = 1;
      this.__invViewMat.multiplyVectorTo(this.__tmp_vec4_1, this.__tmp_vec4_array[i]);
      this.corners[i] = this.__tmp_vec4_array[i];
    }
  }

  /**
   * Performs frustum culling test against a mesh component's bounding box.
   * Uses optimized frustum-AABB intersection algorithm to determine visibility.
   *
   * @param meshComponent - The mesh component to test for culling
   * @returns `false` if the mesh is completely outside the frustum (should be culled),
   *          `true` if the mesh is inside or intersects the frustum (should be rendered)
   *
   * @remarks
   * This method uses a two-phase approach:
   * 1. Tests if the AABB is completely outside any frustum plane
   * 2. Tests if all frustum corners are outside any AABB face
   *
   * The algorithm is based on the optimized frustum culling technique described at:
   * https://iquilezles.org/articles/frustumcorrect/
   *
   * @example
   * ```typescript
   * const frustum = new Frustum();
   * frustum.update(viewMatrix, projectionMatrix);
   *
   * if (frustum.culling(meshComponent)) {
   *   // Render the mesh
   *   renderMesh(meshComponent);
   * }
   * // Otherwise, skip rendering (culled)
   * ```
   */
  culling(meshComponent: MeshComponent) {
    const aabb = meshComponent.entity.getSceneGraph().worldMergedAABBWithSkeletal;

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
    let out = 0;
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.x > aabb.maxPoint.x ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.x < aabb.minPoint.x ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.y > aabb.maxPoint.y ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.y < aabb.minPoint.y ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.z > aabb.maxPoint.z ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }
    out = 0;
    for (let i = 0; i < 8; i++) {
      const plane = this.corners[i];
      out += plane.z < aabb.minPoint.z ? 1 : 0;
    }
    if (out === 8) {
      return false;
    }

    return true;
  }

  /**
   * Retrieves a specific frustum plane by index.
   *
   * @param i - The plane index (0-5)
   *   - 0: Top plane
   *   - 1: Bottom plane
   *   - 2: Right plane
   *   - 3: Left plane
   *   - 4: Near plane
   *   - 5: Far plane
   *
   * @returns The plane as a Vector4 where (x,y,z) represents the plane normal
   *          and w represents the distance from the origin
   *
   * @throws {Error} Throws an error if the plane index is invalid (not 0-5)
   *
   * @example
   * ```typescript
   * const frustum = new Frustum();
   * const topPlane = frustum.getPlane(0);    // Get top plane
   * const nearPlane = frustum.getPlane(4);   // Get near plane
   * ```
   */
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
