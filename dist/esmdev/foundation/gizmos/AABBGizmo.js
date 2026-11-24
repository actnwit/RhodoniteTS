// src/foundation/gizmos/AABBGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
import { Gizmo } from "./Gizmo.js";
var AABBGizmo = class _AABBGizmo extends Gizmo {
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Checks if the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up and ready to render, false otherwise
   */
  get isSetup() {
    if (this.im != null) {
      return true;
    }
    return false;
  }
  ///
  ///
  /// Friends Members
  ///
  ///
  /**
   * Initializes the gizmo entities and mesh components if not already done.
   * Creates the wireframe mesh entity, sets up the primitive geometry,
   * and attaches it to the target entity's scene graph.
   * @internal
   */
  _setup() {
    if (this.km()) {
      return;
    }
    this.im = createMeshEntity(this.c);
    this.im.tryToSetUniqueName(`AABBGizmo_of_${this.jm.uniqueName}`, true);
    this.im.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.jm.getSceneGraph()._addGizmoChild(this.im.getSceneGraph());
    const meshComponent = this.im.tryToGetMesh();
    _AABBGizmo.Nd = new Mesh(this.c);
    _AABBGizmo.Nd.addPrimitive(_AABBGizmo.generatePrimitive(this.c));
    meshComponent.setMesh(_AABBGizmo.Nd);
    this.setGizmoTag();
    this._update();
  }
  /**
   * Generates the wireframe primitive geometry for the AABB visualization.
   * Creates a unit cube with line primitives that form the edges of the bounding box.
   * The cube vertices are arranged from -1 to +1 in each axis and will be scaled
   * appropriately during rendering.
   * @returns A primitive object containing the wireframe geometry for the AABB
   */
  static generatePrimitive(engine) {
    const indices = new Uint32Array([
      // XY Plane on -Z
      0,
      1,
      1,
      2,
      2,
      3,
      3,
      0,
      // XY Plane on +Z
      4,
      5,
      5,
      6,
      6,
      7,
      7,
      4,
      // YZ Plane on -X
      0,
      3,
      3,
      7,
      7,
      4,
      4,
      0,
      // YZ Plane on +X
      1,
      2,
      2,
      6,
      6,
      5,
      5,
      1,
      // XZ Plane on -Y
      0,
      1,
      1,
      5,
      5,
      4,
      4,
      0,
      // XZ Plane on +Y
      3,
      2,
      2,
      6,
      6,
      7,
      7,
      3
    ]);
    const length = 1;
    const positions = new Float32Array([
      /// -Z
      // 0
      -length,
      -length,
      -length,
      // 1
      length,
      -length,
      -length,
      // 2
      length,
      length,
      -length,
      // 3
      -length,
      length,
      -length,
      /// +Z
      // 4
      -length,
      -length,
      length,
      // 5
      length,
      -length,
      length,
      // 6
      length,
      length,
      length,
      // 7
      -length,
      length,
      length
    ]);
    const primitive = Primitive.createPrimitive(engine, {
      indices,
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines
    });
    return primitive;
  }
  /**
   * Updates the gizmo's transform to match the target entity's current AABB.
   * Repositions and rescales the wireframe to accurately represent the target's
   * world-space bounding box including skeletal deformations.
   * @internal
   */
  _update() {
    if (this.im == null) {
      return;
    }
    const sg = this.jm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    this.im.getTransform().localPosition = aabb.centerPoint;
    const minHalfExtent = 1e-4;
    this.im.getTransform().localScale = Vector3.fromCopyArray([
      Math.max(aabb.sizeX / 2, minHalfExtent),
      Math.max(aabb.sizeY / 2, minHalfExtent),
      Math.max(aabb.sizeZ / 2, minHalfExtent)
    ]);
  }
  /**
   * Destroys the gizmo and cleans up all associated resources.
   * Removes the gizmo entity from the scene graph and frees memory.
   * @internal
   */
  _destroy() {
    if (Is.exist(this.im)) {
      this.im._destroy();
    }
  }
  /**
   * Cleans up all static resources for a specific Engine.
   * This resets static members so that gizmos can be recreated with a new Engine.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(_engine) {
    _AABBGizmo.Nd = void 0;
  }
};
export {
  AABBGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0FBQkJHaXptby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlTWVzaEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaFJlbmRlcmVyL2NyZWF0ZU1lc2hFbnRpdHknO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgR2l6bW8gfSBmcm9tICcuL0dpem1vJztcblxuLyoqXG4gKiBBQUJCIEdpem1vIGNsYXNzIHRoYXQgdmlzdWFsaXplcyB0aGUgQXhpcy1BbGlnbmVkIEJvdW5kaW5nIEJveCBvZiBhIHRhcmdldCBlbnRpdHkuXG4gKiBUaGlzIGdpem1vIHJlbmRlcnMgYSB3aXJlZnJhbWUgYm94IGFyb3VuZCB0aGUgdGFyZ2V0IGVudGl0eSBzaG93aW5nIGl0cyBzcGF0aWFsIGJvdW5kYXJpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBQUJCR2l6bW8gZXh0ZW5kcyBHaXptbyB7XG4gIHByaXZhdGUgc3RhdGljIF9fbWVzaD86IE1lc2g7XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gQWNjZXNzb3JzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBnaXptbyBoYXMgYmVlbiBwcm9wZXJseSBzZXQgdXAgYW5kIGluaXRpYWxpemVkLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbyBpcyBzZXQgdXAgYW5kIHJlYWR5IHRvIHJlbmRlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTZXR1cCgpIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gRnJpZW5kcyBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGdpem1vIGVudGl0aWVzIGFuZCBtZXNoIGNvbXBvbmVudHMgaWYgbm90IGFscmVhZHkgZG9uZS5cbiAgICogQ3JlYXRlcyB0aGUgd2lyZWZyYW1lIG1lc2ggZW50aXR5LCBzZXRzIHVwIHRoZSBwcmltaXRpdmUgZ2VvbWV0cnksXG4gICAqIGFuZCBhdHRhY2hlcyBpdCB0byB0aGUgdGFyZ2V0IGVudGl0eSdzIHNjZW5lIGdyYXBoLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fdG9wRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5IS50cnlUb1NldFVuaXF1ZU5hbWUoYEFBQkJHaXptb19vZl8ke3RoaXMuX190YXJnZXQudW5pcXVlTmFtZX1gLCB0cnVlKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5IS5nZXRTY2VuZUdyYXBoKCkhLnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggPSB0cnVlO1xuICAgIHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpIS5fYWRkR2l6bW9DaGlsZCh0aGlzLl9fdG9wRW50aXR5IS5nZXRTY2VuZUdyYXBoKCkhKTtcblxuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLl9fdG9wRW50aXR5IS50cnlUb0dldE1lc2goKSE7XG4gICAgQUFCQkdpem1vLl9fbWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIEFBQkJHaXptby5fX21lc2guYWRkUHJpbWl0aXZlKEFBQkJHaXptby5nZW5lcmF0ZVByaW1pdGl2ZSh0aGlzLl9fZW5naW5lKSk7XG4gICAgbWVzaENvbXBvbmVudC5zZXRNZXNoKEFBQkJHaXptby5fX21lc2gpO1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuXG4gICAgdGhpcy5fdXBkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHRoZSB3aXJlZnJhbWUgcHJpbWl0aXZlIGdlb21ldHJ5IGZvciB0aGUgQUFCQiB2aXN1YWxpemF0aW9uLlxuICAgKiBDcmVhdGVzIGEgdW5pdCBjdWJlIHdpdGggbGluZSBwcmltaXRpdmVzIHRoYXQgZm9ybSB0aGUgZWRnZXMgb2YgdGhlIGJvdW5kaW5nIGJveC5cbiAgICogVGhlIGN1YmUgdmVydGljZXMgYXJlIGFycmFuZ2VkIGZyb20gLTEgdG8gKzEgaW4gZWFjaCBheGlzIGFuZCB3aWxsIGJlIHNjYWxlZFxuICAgKiBhcHByb3ByaWF0ZWx5IGR1cmluZyByZW5kZXJpbmcuXG4gICAqIEByZXR1cm5zIEEgcHJpbWl0aXZlIG9iamVjdCBjb250YWluaW5nIHRoZSB3aXJlZnJhbWUgZ2VvbWV0cnkgZm9yIHRoZSBBQUJCXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBnZW5lcmF0ZVByaW1pdGl2ZShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDMyQXJyYXkoW1xuICAgICAgLy8gWFkgUGxhbmUgb24gLVpcbiAgICAgIDAsIDEsIDEsIDIsIDIsIDMsIDMsIDAsXG5cbiAgICAgIC8vIFhZIFBsYW5lIG9uICtaXG4gICAgICA0LCA1LCA1LCA2LCA2LCA3LCA3LCA0LFxuXG4gICAgICAvLyBZWiBQbGFuZSBvbiAtWFxuICAgICAgMCwgMywgMywgNywgNywgNCwgNCwgMCxcblxuICAgICAgLy8gWVogUGxhbmUgb24gK1hcbiAgICAgIDEsIDIsIDIsIDYsIDYsIDUsIDUsIDEsXG5cbiAgICAgIC8vIFhaIFBsYW5lIG9uIC1ZXG4gICAgICAwLCAxLCAxLCA1LCA1LCA0LCA0LCAwLFxuXG4gICAgICAvLyBYWiBQbGFuZSBvbiArWVxuICAgICAgMywgMiwgMiwgNiwgNiwgNywgNywgMyxcbiAgICBdKTtcblxuICAgIGNvbnN0IGxlbmd0aCA9IDE7XG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAvLy8gLVpcbiAgICAgIC8vIDBcbiAgICAgIC1sZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuICAgICAgLWxlbmd0aCxcblxuICAgICAgLy8gMVxuICAgICAgbGVuZ3RoLFxuICAgICAgLWxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG5cbiAgICAgIC8vIDJcbiAgICAgIGxlbmd0aCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG5cbiAgICAgIC8vIDNcbiAgICAgIC1sZW5ndGgsXG4gICAgICBsZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuXG4gICAgICAvLy8gK1pcbiAgICAgIC8vIDRcbiAgICAgIC1sZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuICAgICAgbGVuZ3RoLFxuXG4gICAgICAvLyA1XG4gICAgICBsZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuICAgICAgbGVuZ3RoLFxuXG4gICAgICAvLyA2XG4gICAgICBsZW5ndGgsXG4gICAgICBsZW5ndGgsXG4gICAgICBsZW5ndGgsXG5cbiAgICAgIC8vIDdcbiAgICAgIC1sZW5ndGgsXG4gICAgICBsZW5ndGgsXG4gICAgICBsZW5ndGgsXG4gICAgXSk7XG5cbiAgICBjb25zdCBwcmltaXRpdmUgPSBQcmltaXRpdmUuY3JlYXRlUHJpbWl0aXZlKGVuZ2luZSwge1xuICAgICAgaW5kaWNlczogaW5kaWNlcyxcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogW1ZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVpdLFxuICAgICAgYXR0cmlidXRlczogW3Bvc2l0aW9uc10sXG4gICAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlLkxpbmVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBnaXptbydzIHRyYW5zZm9ybSB0byBtYXRjaCB0aGUgdGFyZ2V0IGVudGl0eSdzIGN1cnJlbnQgQUFCQi5cbiAgICogUmVwb3NpdGlvbnMgYW5kIHJlc2NhbGVzIHRoZSB3aXJlZnJhbWUgdG8gYWNjdXJhdGVseSByZXByZXNlbnQgdGhlIHRhcmdldCdzXG4gICAqIHdvcmxkLXNwYWNlIGJvdW5kaW5nIGJveCBpbmNsdWRpbmcgc2tlbGV0YWwgZGVmb3JtYXRpb25zLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF91cGRhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZyA9IHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICBjb25zdCBhYWJiID0gc2cud29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsO1xuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsUG9zaXRpb24gPSBhYWJiLmNlbnRlclBvaW50O1xuICAgIC8vIEEgZmxhdCBtZXNoIChmb3IgZXhhbXBsZSBhIHBsYW5lKSBoYXMgYSB6ZXJvIGV4dGVudCBvbiBvbmUgYXhpcy4gQSB6ZXJvIHNjYWxlIHdvdWxkIG1ha2VcbiAgICAvLyB0aGUgZ2l6bW8ncyB3b3JsZCBtYXRyaXggc2luZ3VsYXIsIHNvIGtlZXAgZXZlcnkgYXhpcyBhdCBhIHRpbnksIHN0aWxsIGludmlzaWJsZSwgc2l6ZS5cbiAgICBjb25zdCBtaW5IYWxmRXh0ZW50ID0gMWUtNDtcbiAgICB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgIE1hdGgubWF4KGFhYmIuc2l6ZVggLyAyLCBtaW5IYWxmRXh0ZW50KSxcbiAgICAgIE1hdGgubWF4KGFhYmIuc2l6ZVkgLyAyLCBtaW5IYWxmRXh0ZW50KSxcbiAgICAgIE1hdGgubWF4KGFhYmIuc2l6ZVogLyAyLCBtaW5IYWxmRXh0ZW50KSxcbiAgICBdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZ2l6bW8gYW5kIGNsZWFucyB1cCBhbGwgYXNzb2NpYXRlZCByZXNvdXJjZXMuXG4gICAqIFJlbW92ZXMgdGhlIGdpem1vIGVudGl0eSBmcm9tIHRoZSBzY2VuZSBncmFwaCBhbmQgZnJlZXMgbWVtb3J5LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIGlmIChJcy5leGlzdCh0aGlzLl9fdG9wRW50aXR5KSkge1xuICAgICAgdGhpcy5fX3RvcEVudGl0eS5fZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgYWxsIHN0YXRpYyByZXNvdXJjZXMgZm9yIGEgc3BlY2lmaWMgRW5naW5lLlxuICAgKiBUaGlzIHJlc2V0cyBzdGF0aWMgbWVtYmVycyBzbyB0aGF0IGdpem1vcyBjYW4gYmUgcmVjcmVhdGVkIHdpdGggYSBuZXcgRW5naW5lLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gRW5naW5lLmRlc3Ryb3koKVxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKF9lbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIEFBQkJHaXptby5fX21lc2ggPSB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLFlBQVk7QUFDckIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUVuQixTQUFTLGFBQWE7QUFNZixJQUFNLFlBQU4sTUFBTSxtQkFBa0IsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYW5DLElBQUksVUFBVTtBQUNaLFFBQUksS0FBS0EsTUFBZSxNQUFNO0FBQzVCLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjQSxTQUFlO0FBQ2IsUUFBSSxLQUFLQyxHQUFjLEdBQUc7QUFDeEI7QUFBQSxJQUNGO0FBRUEsU0FBS0QsS0FBYyxpQkFBaUIsS0FBS0UsQ0FBUTtBQUNqRCxTQUFLRixHQUFhLG1CQUFtQixnQkFBZ0IsS0FBS0csR0FBUyxVQUFVLElBQUksSUFBSTtBQUNyRixTQUFLSCxHQUFhLGNBQWMsRUFBRyx3Q0FBd0M7QUFDM0UsU0FBS0csR0FBUyxjQUFjLEVBQUcsZUFBZSxLQUFLSCxHQUFhLGNBQWMsQ0FBRTtBQUVoRixVQUFNLGdCQUFnQixLQUFLQSxHQUFhLGFBQWE7QUFDckQsZUFBVUksS0FBUyxJQUFJLEtBQUssS0FBS0YsQ0FBUTtBQUN6QyxlQUFVRSxHQUFPLGFBQWEsV0FBVSxrQkFBa0IsS0FBS0YsQ0FBUSxDQUFDO0FBQ3hFLGtCQUFjLFFBQVEsV0FBVUUsRUFBTTtBQUV0QyxTQUFLLFlBQVk7QUFFakIsU0FBSyxRQUFRO0FBQUEsRUFDZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFlLGtCQUFrQixRQUFnQjtBQUMvQyxVQUFNLFVBQVUsSUFBSSxZQUFZO0FBQUE7QUFBQSxNQUU5QjtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQTtBQUFBLE1BR3JCO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBO0FBQUEsTUFHckI7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUE7QUFBQSxNQUdyQjtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQTtBQUFBLE1BR3JCO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBO0FBQUEsTUFHckI7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsSUFDdkIsQ0FBQztBQUVELFVBQU0sU0FBUztBQUNmLFVBQU0sWUFBWSxJQUFJLGFBQWE7QUFBQTtBQUFBO0FBQUEsTUFHakMsQ0FBQztBQUFBLE1BQ0QsQ0FBQztBQUFBLE1BQ0QsQ0FBQztBQUFBO0FBQUEsTUFHRDtBQUFBLE1BQ0EsQ0FBQztBQUFBLE1BQ0QsQ0FBQztBQUFBO0FBQUEsTUFHRDtBQUFBLE1BQ0E7QUFBQSxNQUNBLENBQUM7QUFBQTtBQUFBLE1BR0QsQ0FBQztBQUFBLE1BQ0Q7QUFBQSxNQUNBLENBQUM7QUFBQTtBQUFBO0FBQUEsTUFJRCxDQUFDO0FBQUEsTUFDRCxDQUFDO0FBQUEsTUFDRDtBQUFBO0FBQUEsTUFHQTtBQUFBLE1BQ0EsQ0FBQztBQUFBLE1BQ0Q7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUEsTUFHQSxDQUFDO0FBQUEsTUFDRDtBQUFBLE1BQ0E7QUFBQSxJQUNGLENBQUM7QUFFRCxVQUFNLFlBQVksVUFBVSxnQkFBZ0IsUUFBUTtBQUFBLE1BQ2xEO0FBQUEsTUFDQSxvQkFBb0IsQ0FBQyxnQkFBZ0IsU0FBUyxHQUFHO0FBQUEsTUFDakQsWUFBWSxDQUFDLFNBQVM7QUFBQSxNQUN0QixlQUFlLGNBQWM7QUFBQSxJQUMvQixDQUFDO0FBRUQsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFVBQWdCO0FBQ2QsUUFBSSxLQUFLSixNQUFlLE1BQU07QUFDNUI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxLQUFLLEtBQUtHLEdBQVMsY0FBYztBQUN2QyxVQUFNLE9BQU8sR0FBRztBQUNoQixTQUFLSCxHQUFZLGFBQWEsRUFBRyxnQkFBZ0IsS0FBSztBQUd0RCxVQUFNLGdCQUFnQjtBQUN0QixTQUFLQSxHQUFZLGFBQWEsRUFBRyxhQUFhLFFBQVEsY0FBYztBQUFBLE1BQ2xFLEtBQUssSUFBSSxLQUFLLFFBQVEsR0FBRyxhQUFhO0FBQUEsTUFDdEMsS0FBSyxJQUFJLEtBQUssUUFBUSxHQUFHLGFBQWE7QUFBQSxNQUN0QyxLQUFLLElBQUksS0FBSyxRQUFRLEdBQUcsYUFBYTtBQUFBLElBQ3hDLENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsV0FBaUI7QUFDZixRQUFJLEdBQUcsTUFBTSxLQUFLQSxFQUFXLEdBQUc7QUFDOUIsV0FBS0EsR0FBWSxTQUFTO0FBQUEsSUFDNUI7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxrQkFBa0IsU0FBdUI7QUFDOUMsZUFBVUksS0FBUztBQUFBLEVBQ3JCO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fdG9wRW50aXR5IiwgIl9fdG9Ta2lwU2V0dXAiLCAiX19lbmdpbmUiLCAiX190YXJnZXQiLCAiX19tZXNoIl0KfQo=
