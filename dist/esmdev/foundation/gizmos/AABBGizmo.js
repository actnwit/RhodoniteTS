// src/foundation/gizmos/AABBGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
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
    if (this.pm != null) {
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
    if (this.rm()) {
      return;
    }
    this.pm = createMeshEntity(this.c);
    this.pm.tryToSetUniqueName(`AABBGizmo_of_${this.qm.uniqueName}`, true);
    this.pm.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.qm.getSceneGraph()._addGizmoChild(this.pm.getSceneGraph());
    const meshComponent = this.pm.tryToGetMesh();
    _AABBGizmo.Rd = new Mesh(this.c);
    _AABBGizmo.Rd.addPrimitive(_AABBGizmo.generatePrimitive(this.c));
    meshComponent.setMesh(_AABBGizmo.Rd);
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
    if (this.pm == null) {
      return;
    }
    const sg = this.qm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    this.pm.getTransform().localPosition = aabb.centerPoint;
    const minHalfExtent = 1e-4;
    this.pm.getTransform().localScale = Vector3.fromCopyArray([
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
    this.sm();
  }
  /**
   * Cleans up all static resources for a specific Engine.
   * This resets static members so that gizmos can be recreated with a new Engine.
   * @internal Called from Engine.destroy()
   */
  static _cleanupForEngine(_engine) {
    _AABBGizmo.Rd = void 0;
  }
};
export {
  AABBGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0FBQkJHaXptby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlTWVzaEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaFJlbmRlcmVyL2NyZWF0ZU1lc2hFbnRpdHknO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG4vKipcbiAqIEFBQkIgR2l6bW8gY2xhc3MgdGhhdCB2aXN1YWxpemVzIHRoZSBBeGlzLUFsaWduZWQgQm91bmRpbmcgQm94IG9mIGEgdGFyZ2V0IGVudGl0eS5cbiAqIFRoaXMgZ2l6bW8gcmVuZGVycyBhIHdpcmVmcmFtZSBib3ggYXJvdW5kIHRoZSB0YXJnZXQgZW50aXR5IHNob3dpbmcgaXRzIHNwYXRpYWwgYm91bmRhcmllcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFBQkJHaXptbyBleHRlbmRzIEdpem1vIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX19tZXNoPzogTWVzaDtcblxuICAvLy9cbiAgLy8vXG4gIC8vLyBBY2Nlc3NvcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGdpem1vIGhhcyBiZWVuIHByb3Blcmx5IHNldCB1cCBhbmQgaW5pdGlhbGl6ZWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIHNldCB1cCBhbmQgcmVhZHkgdG8gcmVuZGVyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGdldCBpc1NldHVwKCkge1xuICAgIGlmICh0aGlzLl9fdG9wRW50aXR5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBGcmllbmRzIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgZ2l6bW8gZW50aXRpZXMgYW5kIG1lc2ggY29tcG9uZW50cyBpZiBub3QgYWxyZWFkeSBkb25lLlxuICAgKiBDcmVhdGVzIHRoZSB3aXJlZnJhbWUgbWVzaCBlbnRpdHksIHNldHMgdXAgdGhlIHByaW1pdGl2ZSBnZW9tZXRyeSxcbiAgICogYW5kIGF0dGFjaGVzIGl0IHRvIHRoZSB0YXJnZXQgZW50aXR5J3Mgc2NlbmUgZ3JhcGguXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldHVwKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fdG9Ta2lwU2V0dXAoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX190b3BFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLnRyeVRvU2V0VW5pcXVlTmFtZShgQUFCQkdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSEudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWU7XG4gICAgdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkhLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSEpO1xuXG4gICAgY29uc3QgbWVzaENvbXBvbmVudCA9IHRoaXMuX190b3BFbnRpdHkhLnRyeVRvR2V0TWVzaCgpITtcbiAgICBBQUJCR2l6bW8uX19tZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgQUFCQkdpem1vLl9fbWVzaC5hZGRQcmltaXRpdmUoQUFCQkdpem1vLmdlbmVyYXRlUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUpKTtcbiAgICBtZXNoQ29tcG9uZW50LnNldE1lc2goQUFCQkdpem1vLl9fbWVzaCk7XG5cbiAgICB0aGlzLnNldEdpem1vVGFnKCk7XG5cbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGhlIHdpcmVmcmFtZSBwcmltaXRpdmUgZ2VvbWV0cnkgZm9yIHRoZSBBQUJCIHZpc3VhbGl6YXRpb24uXG4gICAqIENyZWF0ZXMgYSB1bml0IGN1YmUgd2l0aCBsaW5lIHByaW1pdGl2ZXMgdGhhdCBmb3JtIHRoZSBlZGdlcyBvZiB0aGUgYm91bmRpbmcgYm94LlxuICAgKiBUaGUgY3ViZSB2ZXJ0aWNlcyBhcmUgYXJyYW5nZWQgZnJvbSAtMSB0byArMSBpbiBlYWNoIGF4aXMgYW5kIHdpbGwgYmUgc2NhbGVkXG4gICAqIGFwcHJvcHJpYXRlbHkgZHVyaW5nIHJlbmRlcmluZy5cbiAgICogQHJldHVybnMgQSBwcmltaXRpdmUgb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHdpcmVmcmFtZSBnZW9tZXRyeSBmb3IgdGhlIEFBQkJcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGdlbmVyYXRlUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lKSB7XG4gICAgY29uc3QgaW5kaWNlcyA9IG5ldyBVaW50MzJBcnJheShbXG4gICAgICAvLyBYWSBQbGFuZSBvbiAtWlxuICAgICAgMCwgMSwgMSwgMiwgMiwgMywgMywgMCxcblxuICAgICAgLy8gWFkgUGxhbmUgb24gK1pcbiAgICAgIDQsIDUsIDUsIDYsIDYsIDcsIDcsIDQsXG5cbiAgICAgIC8vIFlaIFBsYW5lIG9uIC1YXG4gICAgICAwLCAzLCAzLCA3LCA3LCA0LCA0LCAwLFxuXG4gICAgICAvLyBZWiBQbGFuZSBvbiArWFxuICAgICAgMSwgMiwgMiwgNiwgNiwgNSwgNSwgMSxcblxuICAgICAgLy8gWFogUGxhbmUgb24gLVlcbiAgICAgIDAsIDEsIDEsIDUsIDUsIDQsIDQsIDAsXG5cbiAgICAgIC8vIFhaIFBsYW5lIG9uICtZXG4gICAgICAzLCAyLCAyLCA2LCA2LCA3LCA3LCAzLFxuICAgIF0pO1xuXG4gICAgY29uc3QgbGVuZ3RoID0gMTtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vLyAtWlxuICAgICAgLy8gMFxuICAgICAgLWxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuXG4gICAgICAvLyAxXG4gICAgICBsZW5ndGgsXG4gICAgICAtbGVuZ3RoLFxuICAgICAgLWxlbmd0aCxcblxuICAgICAgLy8gMlxuICAgICAgbGVuZ3RoLFxuICAgICAgbGVuZ3RoLFxuICAgICAgLWxlbmd0aCxcblxuICAgICAgLy8gM1xuICAgICAgLWxlbmd0aCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG5cbiAgICAgIC8vLyArWlxuICAgICAgLy8gNFxuICAgICAgLWxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG4gICAgICBsZW5ndGgsXG5cbiAgICAgIC8vIDVcbiAgICAgIGxlbmd0aCxcbiAgICAgIC1sZW5ndGgsXG4gICAgICBsZW5ndGgsXG5cbiAgICAgIC8vIDZcbiAgICAgIGxlbmd0aCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIGxlbmd0aCxcblxuICAgICAgLy8gN1xuICAgICAgLWxlbmd0aCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIGxlbmd0aCxcbiAgICBdKTtcblxuICAgIGNvbnN0IHByaW1pdGl2ZSA9IFByaW1pdGl2ZS5jcmVhdGVQcmltaXRpdmUoZW5naW5lLCB7XG4gICAgICBpbmRpY2VzOiBpbmRpY2VzLFxuICAgICAgYXR0cmlidXRlU2VtYW50aWNzOiBbVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWl0sXG4gICAgICBhdHRyaWJ1dGVzOiBbcG9zaXRpb25zXSxcbiAgICAgIHByaW1pdGl2ZU1vZGU6IFByaW1pdGl2ZU1vZGUuTGluZXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGdpem1vJ3MgdHJhbnNmb3JtIHRvIG1hdGNoIHRoZSB0YXJnZXQgZW50aXR5J3MgY3VycmVudCBBQUJCLlxuICAgKiBSZXBvc2l0aW9ucyBhbmQgcmVzY2FsZXMgdGhlIHdpcmVmcmFtZSB0byBhY2N1cmF0ZWx5IHJlcHJlc2VudCB0aGUgdGFyZ2V0J3NcbiAgICogd29ybGQtc3BhY2UgYm91bmRpbmcgYm94IGluY2x1ZGluZyBza2VsZXRhbCBkZWZvcm1hdGlvbnMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNnID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkhO1xuICAgIGNvbnN0IGFhYmIgPSBzZy53b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IGFhYmIuY2VudGVyUG9pbnQ7XG4gICAgLy8gQSBmbGF0IG1lc2ggKGZvciBleGFtcGxlIGEgcGxhbmUpIGhhcyBhIHplcm8gZXh0ZW50IG9uIG9uZSBheGlzLiBBIHplcm8gc2NhbGUgd291bGQgbWFrZVxuICAgIC8vIHRoZSBnaXptbydzIHdvcmxkIG1hdHJpeCBzaW5ndWxhciwgc28ga2VlcCBldmVyeSBheGlzIGF0IGEgdGlueSwgc3RpbGwgaW52aXNpYmxlLCBzaXplLlxuICAgIGNvbnN0IG1pbkhhbGZFeHRlbnQgPSAxZS00O1xuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgTWF0aC5tYXgoYWFiYi5zaXplWCAvIDIsIG1pbkhhbGZFeHRlbnQpLFxuICAgICAgTWF0aC5tYXgoYWFiYi5zaXplWSAvIDIsIG1pbkhhbGZFeHRlbnQpLFxuICAgICAgTWF0aC5tYXgoYWFiYi5zaXplWiAvIDIsIG1pbkhhbGZFeHRlbnQpLFxuICAgIF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBnaXptbyBhbmQgY2xlYW5zIHVwIGFsbCBhc3NvY2lhdGVkIHJlc291cmNlcy5cbiAgICogUmVtb3ZlcyB0aGUgZ2l6bW8gZW50aXR5IGZyb20gdGhlIHNjZW5lIGdyYXBoIGFuZCBmcmVlcyBtZW1vcnkuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5fX2Rlc3Ryb3lUb3BFbnRpdHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnMgdXAgYWxsIHN0YXRpYyByZXNvdXJjZXMgZm9yIGEgc3BlY2lmaWMgRW5naW5lLlxuICAgKiBUaGlzIHJlc2V0cyBzdGF0aWMgbWVtYmVycyBzbyB0aGF0IGdpem1vcyBjYW4gYmUgcmVjcmVhdGVkIHdpdGggYSBuZXcgRW5naW5lLlxuICAgKiBAaW50ZXJuYWwgQ2FsbGVkIGZyb20gRW5naW5lLmRlc3Ryb3koKVxuICAgKi9cbiAgc3RhdGljIF9jbGVhbnVwRm9yRW5naW5lKF9lbmdpbmU6IEVuZ2luZSk6IHZvaWQge1xuICAgIEFBQkJHaXptby5fX21lc2ggPSB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLFlBQVk7QUFDckIsU0FBUyxpQkFBaUI7QUFDMUIsU0FBUyxl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UztBQUFBLE1BQ3RCLGVBQWUsY0FBYztBQUFBLElBQy9CLENBQUM7QUFFRCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsVUFBZ0I7QUFDZCxRQUFJLEtBQUtKLE1BQWUsTUFBTTtBQUM1QjtBQUFBLElBQ0Y7QUFDQSxVQUFNLEtBQUssS0FBS0csR0FBUyxjQUFjO0FBQ3ZDLFVBQU0sT0FBTyxHQUFHO0FBQ2hCLFNBQUtILEdBQVksYUFBYSxFQUFHLGdCQUFnQixLQUFLO0FBR3RELFVBQU0sZ0JBQWdCO0FBQ3RCLFNBQUtBLEdBQVksYUFBYSxFQUFHLGFBQWEsUUFBUSxjQUFjO0FBQUEsTUFDbEUsS0FBSyxJQUFJLEtBQUssUUFBUSxHQUFHLGFBQWE7QUFBQSxNQUN0QyxLQUFLLElBQUksS0FBSyxRQUFRLEdBQUcsYUFBYTtBQUFBLE1BQ3RDLEtBQUssSUFBSSxLQUFLLFFBQVEsR0FBRyxhQUFhO0FBQUEsSUFDeEMsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxXQUFpQjtBQUNmLFNBQUtLLEdBQW1CO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxPQUFPLGtCQUFrQixTQUF1QjtBQUM5QyxlQUFVRCxLQUFTO0FBQUEsRUFDckI7QUFDRjsiLAogICJuYW1lcyI6IFsiX190b3BFbnRpdHkiLCAiX190b1NraXBTZXR1cCIsICJfX2VuZ2luZSIsICJfX3RhcmdldCIsICJfX21lc2giLCAiX19kZXN0cm95VG9wRW50aXR5Il0KfQo=
