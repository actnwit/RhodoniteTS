// src/foundation/geometry/Frustum.ts
import { Matrix44 } from "../math/Matrix44.js";
import { MutableMatrix44 } from "../math/MutableMatrix44.js";
import { MutableVector4 } from "../math/MutableVector4.js";
import { Vector4 } from "../math/Vector4.js";
var Frustum = class {
  constructor() {
    this.top = MutableVector4.zero();
    this.bottom = MutableVector4.zero();
    this.right = MutableVector4.zero();
    this.left = MutableVector4.zero();
    this.zNear = MutableVector4.zero();
    this.zFar = MutableVector4.zero();
    this.__updated = false;
    this.__vp = MutableMatrix44.zero();
    this.__invProjMat = MutableMatrix44.zero();
    this.__invViewMat = MutableMatrix44.zero();
    this.__tmp_vec4_0 = MutableVector4.zero();
    this.__tmp_vec4_1 = MutableVector4.zero();
    this.__tmp_vec4_array = [
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero(),
      MutableVector4.zero()
    ];
    this.__hCorners = [
      // near
      Vector4.fromCopy4(-1, 1, 1, 1),
      Vector4.fromCopy4(1, 1, 1, 1),
      Vector4.fromCopy4(1, -1, 1, 1),
      Vector4.fromCopy4(-1, -1, 1, 1),
      // far
      Vector4.fromCopy4(-1, 1, -1, 1),
      Vector4.fromCopy4(1, 1, -1, 1),
      Vector4.fromCopy4(1, -1, -1, 1),
      Vector4.fromCopy4(-1, -1, -1, 1)
    ];
    this.corners = [];
  }
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
  update(viewMatrix, projectionMatrix) {
    Matrix44.multiplyTo(projectionMatrix, viewMatrix, this.__vp);
    this.zNear.x = this.__vp.m20 + this.__vp.m30;
    this.zNear.y = this.__vp.m21 + this.__vp.m31;
    this.zNear.z = this.__vp.m22 + this.__vp.m32;
    this.zNear.w = this.__vp.m23 + this.__vp.m33;
    this.zFar.x = -this.__vp.m20 + this.__vp.m30;
    this.zFar.y = -this.__vp.m21 + this.__vp.m31;
    this.zFar.z = -this.__vp.m22 + this.__vp.m32;
    this.zFar.w = -this.__vp.m23 + this.__vp.m33;
    this.bottom.x = this.__vp.m10 + this.__vp.m30;
    this.bottom.y = this.__vp.m11 + this.__vp.m31;
    this.bottom.z = this.__vp.m12 + this.__vp.m32;
    this.bottom.w = this.__vp.m13 + this.__vp.m33;
    this.top.x = -this.__vp.m10 + this.__vp.m30;
    this.top.y = -this.__vp.m11 + this.__vp.m31;
    this.top.z = -this.__vp.m12 + this.__vp.m32;
    this.top.w = -this.__vp.m13 + this.__vp.m33;
    this.left.x = this.__vp.m00 + this.__vp.m30;
    this.left.y = this.__vp.m01 + this.__vp.m31;
    this.left.z = this.__vp.m02 + this.__vp.m32;
    this.left.w = this.__vp.m03 + this.__vp.m33;
    this.right.x = -this.__vp.m00 + this.__vp.m30;
    this.right.y = -this.__vp.m01 + this.__vp.m31;
    this.right.z = -this.__vp.m02 + this.__vp.m32;
    this.right.w = -this.__vp.m03 + this.__vp.m33;
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
  culling(meshComponent) {
    const aabb = meshComponent.entity.getSceneGraph().worldMergedAABBWithSkeletal;
    const min = aabb.minPoint._v;
    const max = aabb.maxPoint._v;
    const minX = min[0];
    const minY = min[1];
    const minZ = min[2];
    const maxX = max[0];
    const maxY = max[1];
    const maxZ = max[2];
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
  getPlane(i) {
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
        throw new Error("Invalid plane index.");
    }
  }
};
export {
  Frustum
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvRnJ1c3R1bS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBJbmRleCB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB0eXBlIHsgTWVzaENvbXBvbmVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaC9NZXNoQ29tcG9uZW50JztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlTWF0cml4NDQgfSBmcm9tICcuLi9tYXRoL011dGFibGVNYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjQnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uL21hdGgvVmVjdG9yNCc7XG5cbi8qKlxuICogVGhlIHZpZXcgZnJ1c3R1bSBjbGFzcy5cbiAqIFJlcHJlc2VudHMgYSB0cnVuY2F0ZWQgcHlyYW1pZCAoZnJ1c3R1bSkgdXNlZCBmb3IgdmlldyBjdWxsaW5nIGluIDNEIGdyYXBoaWNzLlxuICogQ29udGFpbnMgc2l4IHBsYW5lcyAodG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0LCBuZWFyLCBmYXIpIGFuZCBlaWdodCBjb3JuZXIgdmVydGljZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBGcnVzdHVtIHtcbiAgcHVibGljIHRvcCA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHVibGljIGJvdHRvbSA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHVibGljIHJpZ2h0ID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwdWJsaWMgbGVmdCA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHVibGljIHpOZWFyID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwdWJsaWMgekZhciA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHJpdmF0ZSBfX3VwZGF0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX3ZwID0gTXV0YWJsZU1hdHJpeDQ0Lnplcm8oKTtcbiAgcHJpdmF0ZSBfX2ludlByb2pNYXQgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIF9faW52Vmlld01hdCA9IE11dGFibGVNYXRyaXg0NC56ZXJvKCk7XG4gIHByaXZhdGUgX190bXBfdmVjNF8wID0gTXV0YWJsZVZlY3RvcjQuemVybygpO1xuICBwcml2YXRlIF9fdG1wX3ZlYzRfMSA9IE11dGFibGVWZWN0b3I0Lnplcm8oKTtcbiAgcHJpdmF0ZSBfX3RtcF92ZWM0X2FycmF5ID0gW1xuICAgIE11dGFibGVWZWN0b3I0Lnplcm8oKSxcbiAgICBNdXRhYmxlVmVjdG9yNC56ZXJvKCksXG4gICAgTXV0YWJsZVZlY3RvcjQuemVybygpLFxuICAgIE11dGFibGVWZWN0b3I0Lnplcm8oKSxcbiAgICBNdXRhYmxlVmVjdG9yNC56ZXJvKCksXG4gICAgTXV0YWJsZVZlY3RvcjQuemVybygpLFxuICAgIE11dGFibGVWZWN0b3I0Lnplcm8oKSxcbiAgICBNdXRhYmxlVmVjdG9yNC56ZXJvKCksXG4gIF07XG4gIHByaXZhdGUgX19oQ29ybmVycyA9IFtcbiAgICAvLyBuZWFyXG4gICAgVmVjdG9yNC5mcm9tQ29weTQoLTEsIDEsIDEsIDEpLFxuICAgIFZlY3RvcjQuZnJvbUNvcHk0KDEsIDEsIDEsIDEpLFxuICAgIFZlY3RvcjQuZnJvbUNvcHk0KDEsIC0xLCAxLCAxKSxcbiAgICBWZWN0b3I0LmZyb21Db3B5NCgtMSwgLTEsIDEsIDEpLFxuICAgIC8vIGZhclxuICAgIFZlY3RvcjQuZnJvbUNvcHk0KC0xLCAxLCAtMSwgMSksXG4gICAgVmVjdG9yNC5mcm9tQ29weTQoMSwgMSwgLTEsIDEpLFxuICAgIFZlY3RvcjQuZnJvbUNvcHk0KDEsIC0xLCAtMSwgMSksXG4gICAgVmVjdG9yNC5mcm9tQ29weTQoLTEsIC0xLCAtMSwgMSksXG4gIF07XG5cbiAgcHVibGljIGNvcm5lcnM6IFZlY3RvcjRbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoaXMgdmlldyBmcnVzdHVtIGRhdGEgZnJvbSB0aGUgdmlldyBhbmQgcHJvamVjdGlvbiBtYXRyaWNlcy5cbiAgICogQ2FsY3VsYXRlcyB0aGUgc2l4IGZydXN0dW0gcGxhbmVzIGFuZCBlaWdodCBjb3JuZXIgdmVydGljZXMgaW4gd29ybGQgc3BhY2UuXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgd2hlbmV2ZXIgdGhlIGNhbWVyYSdzIHZpZXcgb3IgcHJvamVjdGlvbiBtYXRyaXggY2hhbmdlcy5cbiAgICpcbiAgICogQHBhcmFtIHZpZXdNYXRyaXggLSBUaGUgdmlldyBtYXRyaXggdGhhdCB0cmFuc2Zvcm1zIGZyb20gd29ybGQgc3BhY2UgdG8gdmlldyBzcGFjZVxuICAgKiBAcGFyYW0gcHJvamVjdGlvbk1hdHJpeCAtIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCB0aGF0IHRyYW5zZm9ybXMgZnJvbSB2aWV3IHNwYWNlIHRvIGNsaXAgc3BhY2VcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhlIGZydXN0dW0gcGxhbmVzIGFyZSBjYWxjdWxhdGVkIHVzaW5nIHRoZSBjb21iaW5lZCB2aWV3LXByb2plY3Rpb24gbWF0cml4LlxuICAgKiBDb3JuZXIgdmVydGljZXMgYXJlIGNvbXB1dGVkIGJ5IHRyYW5zZm9ybWluZyBub3JtYWxpemVkIGRldmljZSBjb29yZGluYXRlcyBiYWNrIHRvIHdvcmxkIHNwYWNlLlxuICAgKiBUaGUgcGxhbmVzIGFyZSBzdG9yZWQgYXMgVmVjdG9yNCB3aGVyZSAoeCx5LHopIGlzIHRoZSBub3JtYWwgYW5kIHcgaXMgdGhlIGRpc3RhbmNlIGZyb20gb3JpZ2luLlxuICAgKi9cbiAgdXBkYXRlKHZpZXdNYXRyaXg6IE1hdHJpeDQ0LCBwcm9qZWN0aW9uTWF0cml4OiBNYXRyaXg0NCkge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgcGxhbmVzIG9mIHRoZSB2aWV3IGZydXN0dW0uXG4gICAgTWF0cml4NDQubXVsdGlwbHlUbyhwcm9qZWN0aW9uTWF0cml4LCB2aWV3TWF0cml4LCB0aGlzLl9fdnApO1xuXG4gICAgdGhpcy56TmVhci54ID0gdGhpcy5fX3ZwLm0yMCArIHRoaXMuX192cC5tMzA7XG4gICAgdGhpcy56TmVhci55ID0gdGhpcy5fX3ZwLm0yMSArIHRoaXMuX192cC5tMzE7XG4gICAgdGhpcy56TmVhci56ID0gdGhpcy5fX3ZwLm0yMiArIHRoaXMuX192cC5tMzI7XG4gICAgdGhpcy56TmVhci53ID0gdGhpcy5fX3ZwLm0yMyArIHRoaXMuX192cC5tMzM7XG4gICAgLy8gdGhpcy56TmVhci5ub3JtYWxpemUzKCk7XG5cbiAgICB0aGlzLnpGYXIueCA9IC10aGlzLl9fdnAubTIwICsgdGhpcy5fX3ZwLm0zMDtcbiAgICB0aGlzLnpGYXIueSA9IC10aGlzLl9fdnAubTIxICsgdGhpcy5fX3ZwLm0zMTtcbiAgICB0aGlzLnpGYXIueiA9IC10aGlzLl9fdnAubTIyICsgdGhpcy5fX3ZwLm0zMjtcbiAgICB0aGlzLnpGYXIudyA9IC10aGlzLl9fdnAubTIzICsgdGhpcy5fX3ZwLm0zMztcbiAgICAvLyB0aGlzLnpGYXIubm9ybWFsaXplMygpO1xuXG4gICAgdGhpcy5ib3R0b20ueCA9IHRoaXMuX192cC5tMTAgKyB0aGlzLl9fdnAubTMwO1xuICAgIHRoaXMuYm90dG9tLnkgPSB0aGlzLl9fdnAubTExICsgdGhpcy5fX3ZwLm0zMTtcbiAgICB0aGlzLmJvdHRvbS56ID0gdGhpcy5fX3ZwLm0xMiArIHRoaXMuX192cC5tMzI7XG4gICAgdGhpcy5ib3R0b20udyA9IHRoaXMuX192cC5tMTMgKyB0aGlzLl9fdnAubTMzO1xuICAgIC8vIHRoaXMuYm90dG9tLm5vcm1hbGl6ZTMoKTtcblxuICAgIHRoaXMudG9wLnggPSAtdGhpcy5fX3ZwLm0xMCArIHRoaXMuX192cC5tMzA7XG4gICAgdGhpcy50b3AueSA9IC10aGlzLl9fdnAubTExICsgdGhpcy5fX3ZwLm0zMTtcbiAgICB0aGlzLnRvcC56ID0gLXRoaXMuX192cC5tMTIgKyB0aGlzLl9fdnAubTMyO1xuICAgIHRoaXMudG9wLncgPSAtdGhpcy5fX3ZwLm0xMyArIHRoaXMuX192cC5tMzM7XG4gICAgLy8gdGhpcy50b3Aubm9ybWFsaXplMygpO1xuXG4gICAgdGhpcy5sZWZ0LnggPSB0aGlzLl9fdnAubTAwICsgdGhpcy5fX3ZwLm0zMDtcbiAgICB0aGlzLmxlZnQueSA9IHRoaXMuX192cC5tMDEgKyB0aGlzLl9fdnAubTMxO1xuICAgIHRoaXMubGVmdC56ID0gdGhpcy5fX3ZwLm0wMiArIHRoaXMuX192cC5tMzI7XG4gICAgdGhpcy5sZWZ0LncgPSB0aGlzLl9fdnAubTAzICsgdGhpcy5fX3ZwLm0zMztcbiAgICAvLyB0aGlzLmxlZnQubm9ybWFsaXplMygpO1xuXG4gICAgdGhpcy5yaWdodC54ID0gLXRoaXMuX192cC5tMDAgKyB0aGlzLl9fdnAubTMwO1xuICAgIHRoaXMucmlnaHQueSA9IC10aGlzLl9fdnAubTAxICsgdGhpcy5fX3ZwLm0zMTtcbiAgICB0aGlzLnJpZ2h0LnogPSAtdGhpcy5fX3ZwLm0wMiArIHRoaXMuX192cC5tMzI7XG4gICAgdGhpcy5yaWdodC53ID0gLXRoaXMuX192cC5tMDMgKyB0aGlzLl9fdnAubTMzO1xuICAgIC8vIHRoaXMucmlnaHQubm9ybWFsaXplMygpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBjb3JuZXJzIG9mIHRoZSB2aWV3IGZydXN0dW0uXG4gICAgTWF0cml4NDQuaW52ZXJ0VG8ocHJvamVjdGlvbk1hdHJpeCwgdGhpcy5fX2ludlByb2pNYXQpO1xuICAgIE1hdHJpeDQ0LmludmVydFRvKHZpZXdNYXRyaXgsIHRoaXMuX19pbnZWaWV3TWF0KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgdGhpcy5fX2ludlByb2pNYXQubXVsdGlwbHlWZWN0b3JUbyh0aGlzLl9faENvcm5lcnNbaV0sIHRoaXMuX190bXBfdmVjNF8wKTtcbiAgICAgIHRoaXMuX190bXBfdmVjNF8xLnggPSB0aGlzLl9fdG1wX3ZlYzRfMC54IC8gdGhpcy5fX3RtcF92ZWM0XzAudztcbiAgICAgIHRoaXMuX190bXBfdmVjNF8xLnkgPSB0aGlzLl9fdG1wX3ZlYzRfMC55IC8gdGhpcy5fX3RtcF92ZWM0XzAudztcbiAgICAgIHRoaXMuX190bXBfdmVjNF8xLnogPSB0aGlzLl9fdG1wX3ZlYzRfMC56IC8gdGhpcy5fX3RtcF92ZWM0XzAudztcbiAgICAgIHRoaXMuX190bXBfdmVjNF8xLncgPSAxO1xuICAgICAgdGhpcy5fX2ludlZpZXdNYXQubXVsdGlwbHlWZWN0b3JUbyh0aGlzLl9fdG1wX3ZlYzRfMSwgdGhpcy5fX3RtcF92ZWM0X2FycmF5W2ldKTtcbiAgICAgIHRoaXMuY29ybmVyc1tpXSA9IHRoaXMuX190bXBfdmVjNF9hcnJheVtpXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgZnJ1c3R1bSBjdWxsaW5nIHRlc3QgYWdhaW5zdCBhIG1lc2ggY29tcG9uZW50J3MgYm91bmRpbmcgYm94LlxuICAgKiBVc2VzIG9wdGltaXplZCBmcnVzdHVtLUFBQkIgaW50ZXJzZWN0aW9uIGFsZ29yaXRobSB0byBkZXRlcm1pbmUgdmlzaWJpbGl0eS5cbiAgICpcbiAgICogQHBhcmFtIG1lc2hDb21wb25lbnQgLSBUaGUgbWVzaCBjb21wb25lbnQgdG8gdGVzdCBmb3IgY3VsbGluZ1xuICAgKiBAcmV0dXJucyBgZmFsc2VgIGlmIHRoZSBtZXNoIGlzIGNvbXBsZXRlbHkgb3V0c2lkZSB0aGUgZnJ1c3R1bSAoc2hvdWxkIGJlIGN1bGxlZCksXG4gICAqICAgICAgICAgIGB0cnVlYCBpZiB0aGUgbWVzaCBpcyBpbnNpZGUgb3IgaW50ZXJzZWN0cyB0aGUgZnJ1c3R1bSAoc2hvdWxkIGJlIHJlbmRlcmVkKVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIG1ldGhvZCB1c2VzIGEgdHdvLXBoYXNlIGFwcHJvYWNoOlxuICAgKiAxLiBUZXN0cyBpZiB0aGUgQUFCQiBpcyBjb21wbGV0ZWx5IG91dHNpZGUgYW55IGZydXN0dW0gcGxhbmVcbiAgICogMi4gVGVzdHMgaWYgYWxsIGZydXN0dW0gY29ybmVycyBhcmUgb3V0c2lkZSBhbnkgQUFCQiBmYWNlXG4gICAqXG4gICAqIFRoZSBhbGdvcml0aG0gaXMgYmFzZWQgb24gdGhlIG9wdGltaXplZCBmcnVzdHVtIGN1bGxpbmcgdGVjaG5pcXVlIGRlc2NyaWJlZCBhdDpcbiAgICogaHR0cHM6Ly9pcXVpbGV6bGVzLm9yZy9hcnRpY2xlcy9mcnVzdHVtY29ycmVjdC9cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBmcnVzdHVtID0gbmV3IEZydXN0dW0oKTtcbiAgICogZnJ1c3R1bS51cGRhdGUodmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCk7XG4gICAqXG4gICAqIGlmIChmcnVzdHVtLmN1bGxpbmcobWVzaENvbXBvbmVudCkpIHtcbiAgICogICAvLyBSZW5kZXIgdGhlIG1lc2hcbiAgICogICByZW5kZXJNZXNoKG1lc2hDb21wb25lbnQpO1xuICAgKiB9XG4gICAqIC8vIE90aGVyd2lzZSwgc2tpcCByZW5kZXJpbmcgKGN1bGxlZClcbiAgICogYGBgXG4gICAqL1xuICBjdWxsaW5nKG1lc2hDb21wb25lbnQ6IE1lc2hDb21wb25lbnQpIHtcbiAgICBjb25zdCBhYWJiID0gbWVzaENvbXBvbmVudC5lbnRpdHkuZ2V0U2NlbmVHcmFwaCgpLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICBjb25zdCBtaW4gPSBhYWJiLm1pblBvaW50Ll92O1xuICAgIGNvbnN0IG1heCA9IGFhYmIubWF4UG9pbnQuX3Y7XG4gICAgY29uc3QgbWluWCA9IG1pblswXTtcbiAgICBjb25zdCBtaW5ZID0gbWluWzFdO1xuICAgIGNvbnN0IG1pblogPSBtaW5bMl07XG4gICAgY29uc3QgbWF4WCA9IG1heFswXTtcbiAgICBjb25zdCBtYXhZID0gbWF4WzFdO1xuICAgIGNvbnN0IG1heFogPSBtYXhbMl07XG5cbiAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBib3ggaXMgY29tcGxldGVseSBvdXRzaWRlIG9mIG9uZSBvZiB0aGUgZnJ1c3R1bSBwbGFuZXMuXG4gICAgLy8gQWxsIHRoZSA4IGNvcm5lcnMgYXJlIG91dHNpZGUgb2YgYSBwbGFuZSBleGFjdGx5IHdoZW4gdGhlIGNvcm5lciBmYXJ0aGVzdCBhbG9uZyB0aGUgcGxhbmVcbiAgICAvLyBub3JtYWwgKHRoZSBcInBvc2l0aXZlIHZlcnRleFwiKSBpcyBvdXRzaWRlLCBzbyBvbmx5IHRoYXQgY29ybmVyIGlzIHRlc3RlZC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgY29uc3QgcGxhbmUgPSB0aGlzLmdldFBsYW5lKGkpLl92O1xuICAgICAgY29uc3QgcHggPSBwbGFuZVswXTtcbiAgICAgIGNvbnN0IHB5ID0gcGxhbmVbMV07XG4gICAgICBjb25zdCBweiA9IHBsYW5lWzJdO1xuICAgICAgY29uc3QgeCA9IHB4ID49IDAgPyBtYXhYIDogbWluWDtcbiAgICAgIGNvbnN0IHkgPSBweSA+PSAwID8gbWF4WSA6IG1pblk7XG4gICAgICBjb25zdCB6ID0gcHogPj0gMCA/IG1heFogOiBtaW5aO1xuICAgICAgaWYgKHB4ICogeCArIHB5ICogeSArIHB6ICogeiArIHBsYW5lWzNdIDwgMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgZnJ1c3R1bSBpcyBjb21wbGV0ZWx5IG91dHNpZGUgb2Ygb25lIG9mIHRoZSBib3ggZmFjZXMuXG4gICAgY29uc3QgY29ybmVycyA9IHRoaXMuY29ybmVycztcbiAgICBsZXQgb3V0TWluWCA9IDA7XG4gICAgbGV0IG91dE1heFggPSAwO1xuICAgIGxldCBvdXRNaW5ZID0gMDtcbiAgICBsZXQgb3V0TWF4WSA9IDA7XG4gICAgbGV0IG91dE1pblogPSAwO1xuICAgIGxldCBvdXRNYXhaID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgY29uc3QgY29ybmVyID0gY29ybmVyc1tpXS5fdjtcbiAgICAgIGNvbnN0IGN4ID0gY29ybmVyWzBdO1xuICAgICAgY29uc3QgY3kgPSBjb3JuZXJbMV07XG4gICAgICBjb25zdCBjeiA9IGNvcm5lclsyXTtcbiAgICAgIG91dE1heFggKz0gY3ggPiBtYXhYID8gMSA6IDA7XG4gICAgICBvdXRNaW5YICs9IGN4IDwgbWluWCA/IDEgOiAwO1xuICAgICAgb3V0TWF4WSArPSBjeSA+IG1heFkgPyAxIDogMDtcbiAgICAgIG91dE1pblkgKz0gY3kgPCBtaW5ZID8gMSA6IDA7XG4gICAgICBvdXRNYXhaICs9IGN6ID4gbWF4WiA/IDEgOiAwO1xuICAgICAgb3V0TWluWiArPSBjeiA8IG1pblogPyAxIDogMDtcbiAgICB9XG4gICAgaWYgKG91dE1heFggPT09IDggfHwgb3V0TWluWCA9PT0gOCB8fCBvdXRNYXhZID09PSA4IHx8IG91dE1pblkgPT09IDggfHwgb3V0TWF4WiA9PT0gOCB8fCBvdXRNaW5aID09PSA4KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgc3BlY2lmaWMgZnJ1c3R1bSBwbGFuZSBieSBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGkgLSBUaGUgcGxhbmUgaW5kZXggKDAtNSlcbiAgICogICAtIDA6IFRvcCBwbGFuZVxuICAgKiAgIC0gMTogQm90dG9tIHBsYW5lXG4gICAqICAgLSAyOiBSaWdodCBwbGFuZVxuICAgKiAgIC0gMzogTGVmdCBwbGFuZVxuICAgKiAgIC0gNDogTmVhciBwbGFuZVxuICAgKiAgIC0gNTogRmFyIHBsYW5lXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwbGFuZSBhcyBhIFZlY3RvcjQgd2hlcmUgKHgseSx6KSByZXByZXNlbnRzIHRoZSBwbGFuZSBub3JtYWxcbiAgICogICAgICAgICAgYW5kIHcgcmVwcmVzZW50cyB0aGUgZGlzdGFuY2UgZnJvbSB0aGUgb3JpZ2luXG4gICAqXG4gICAqIEB0aHJvd3Mge0Vycm9yfSBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHBsYW5lIGluZGV4IGlzIGludmFsaWQgKG5vdCAwLTUpXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgZnJ1c3R1bSA9IG5ldyBGcnVzdHVtKCk7XG4gICAqIGNvbnN0IHRvcFBsYW5lID0gZnJ1c3R1bS5nZXRQbGFuZSgwKTsgICAgLy8gR2V0IHRvcCBwbGFuZVxuICAgKiBjb25zdCBuZWFyUGxhbmUgPSBmcnVzdHVtLmdldFBsYW5lKDQpOyAgIC8vIEdldCBuZWFyIHBsYW5lXG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0UGxhbmUoaTogSW5kZXgpIHtcbiAgICBzd2l0Y2ggKGkpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wO1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gdGhpcy5ib3R0b207XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiB0aGlzLnJpZ2h0O1xuICAgICAgY2FzZSAzOlxuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0O1xuICAgICAgY2FzZSA0OlxuICAgICAgICByZXR1cm4gdGhpcy56TmVhcjtcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgcmV0dXJuIHRoaXMuekZhcjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwbGFuZSBpbmRleC4nKTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFPakIsSUFBTSxVQUFOLE1BQWM7QUFBQSxFQUFkO0FBQ0wsU0FBTyxNQUFNLGVB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
