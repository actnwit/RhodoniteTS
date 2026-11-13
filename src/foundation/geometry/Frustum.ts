import type { Index } from '../../types/CommonTypes';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import { Matrix44 } from '../math/Matrix44';
import { MutableMatrix44 } from '../math/MutableMatrix44';
import { MutableVector4 } from '../math/MutableVector4';
import { Vector4 } from '../math/Vector4';

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
    const min = aabb.minPoint._v;
    const max = aabb.maxPoint._v;
    const minX = min[0];
    const minY = min[1];
    const minZ = min[2];
    const maxX = max[0];
    const maxY = max[1];
    const maxZ = max[2];

    // Check whether the box is completely outside of one of the frustum planes.
    // All the 8 corners are outside of a plane exactly when the corner farthest along the plane
    // normal (the "positive vertex") is outside, so only that corner is tested.
    for (let i = 0; i < 6; i++) {
      const plane = this.getPlane(i)._v;
      const px = plane[0];
      const py = plane[1];
      const pz = plane[2];
      const x = px >= 0 ? maxX : minX;
      const y = py >= 0 ? maxY : minY;
      const z = pz >= 0 ? maxZ : minZ;
      if (px * x + py * y + pz * z + plane[3] < 0) {
        return false;
      }
    }

    // Check whether the frustum is completely outside of one of the box faces.
    const corners = this.corners;
    let outMinX = 0;
    let outMaxX = 0;
    let outMinY = 0;
    let outMaxY = 0;
    let outMinZ = 0;
    let outMaxZ = 0;
    for (let i = 0; i < 8; i++) {
      const corner = corners[i]._v;
      const cx = corner[0];
      const cy = corner[1];
      const cz = corner[2];
      outMaxX += cx > maxX ? 1 : 0;
      outMinX += cx < minX ? 1 : 0;
      outMaxY += cy > maxY ? 1 : 0;
      outMinY += cy < minY ? 1 : 0;
      outMaxZ += cz > maxZ ? 1 : 0;
      outMinZ += cz < minZ ? 1 : 0;
    }
    if (outMaxX === 8 || outMinX === 8 || outMaxY === 8 || outMinY === 8 || outMaxZ === 8 || outMinZ === 8) {
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
