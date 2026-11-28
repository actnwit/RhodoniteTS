// src/foundation/gizmos/LightGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
import { Gizmo } from "./Gizmo.js";
var _LightGizmo = class _LightGizmo extends Gizmo {
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Checks whether the gizmo has been properly initialized and set up.
   * @returns True if the gizmo's top entity exists and setup is complete, false otherwise
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
   * Initializes the gizmo entities and visual representation if not already done.
   * Creates a mesh entity with a light gizmo primitive and attaches it to the target entity.
   * @internal
   */
  _setup() {
    if (this.rm()) {
      return;
    }
    this.pm = createMeshEntity(this.c);
    this.pm.tryToSetUniqueName(`LightGizmo_of_${this.qm.uniqueName}`, true);
    this.pm.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.qm.getSceneGraph()._addGizmoChild(this.pm.getSceneGraph());
    const meshComponent = this.pm.tryToGetMesh();
    _LightGizmo.Rd = new Mesh(this.c);
    _LightGizmo.Rd.addPrimitive(_LightGizmo.Mm(this.c));
    meshComponent.setMesh(_LightGizmo.Rd);
    this.setGizmoTag();
    this.pm.tryToSetTag({ tag: "Gizmo", value: "Light" });
  }
  /**
   * Updates the transform properties (position, rotation, scale) of the gizmo to match the target entity.
   * The gizmo's position is set to either the target's position or the center of its bounding box,
   * and its scale is adjusted based on the target's bounding box size.
   * @internal
   */
  _update() {
    if (this.pm == null) {
      return;
    }
    const sg = this.qm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    if (aabb.isVanilla()) {
      this.pm.getTransform().localPosition = sg.position;
    } else {
      this.pm.getTransform().localPosition = aabb.centerPoint;
    }
    this.pm.getTransform().localRotation = sg.rotation;
    this.pm.getTransform().localScale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2)
    ]);
  }
  /**
   * Destroys the gizmo and cleans up its resources.
   * @internal
   */
  _destroy() {
    this.sm();
  }
  ///
  ///
  /// Private Static Members
  ///
  ///
  /**
   * Generates the primitive geometry for the light gizmo visualization.
   * Creates a line-based representation showing a directional arrow pointing in the negative Z direction,
   * which is commonly used to represent light direction in 3D graphics.
   * @returns A primitive object containing the line geometry for the light gizmo
   * @private
   */
  static Mm(engine) {
    const positions = new Float32Array([
      // Z axis
      0,
      0,
      0,
      0,
      0,
      -this.Lm,
      // Arrow
      0,
      0,
      -this.Lm,
      -0.1,
      0,
      -this.Lm + 0.2,
      // Arrow end
      -0.1,
      0,
      -this.Lm + 0.2,
      0,
      0,
      -this.Lm + 0.2
    ]);
    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines
    });
    return primitive;
  }
};
_LightGizmo.Lm = 1;
var LightGizmo = _LightGizmo;
export {
  LightGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0xpZ2h0R2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZU1lc2hFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9jcmVhdGVNZXNoRW50aXR5JztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSAnLi4vZ2VvbWV0cnkvTWVzaCc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgR2l6bW8gfSBmcm9tICcuL0dpem1vJztcblxuZXhwb3J0IGNsYXNzIExpZ2h0R2l6bW8gZXh0ZW5kcyBHaXptbyB7XG4gIHByaXZhdGUgc3RhdGljIF9fbWVzaDogTWVzaDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19sZW5ndGggPSAxO1xuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEFjY2Vzc29yc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXptbyBoYXMgYmVlbiBwcm9wZXJseSBpbml0aWFsaXplZCBhbmQgc2V0IHVwLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbydzIHRvcCBlbnRpdHkgZXhpc3RzIGFuZCBzZXR1cCBpcyBjb21wbGV0ZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTZXR1cCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gRnJpZW5kcyBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGdpem1vIGVudGl0aWVzIGFuZCB2aXN1YWwgcmVwcmVzZW50YXRpb24gaWYgbm90IGFscmVhZHkgZG9uZS5cbiAgICogQ3JlYXRlcyBhIG1lc2ggZW50aXR5IHdpdGggYSBsaWdodCBnaXptbyBwcmltaXRpdmUgYW5kIGF0dGFjaGVzIGl0IHRvIHRoZSB0YXJnZXQgZW50aXR5LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fdG9wRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5LnRyeVRvU2V0VW5pcXVlTmFtZShgTGlnaHRHaXptb19vZl8ke3RoaXMuX190YXJnZXQudW5pcXVlTmFtZX1gLCB0cnVlKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5LmdldFNjZW5lR3JhcGgoKSEudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWU7XG4gICAgdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkuX2FkZEdpem1vQ2hpbGQodGhpcy5fX3RvcEVudGl0eSEuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgIGNvbnN0IG1lc2hDb21wb25lbnQgPSB0aGlzLl9fdG9wRW50aXR5IS50cnlUb0dldE1lc2goKSE7XG4gICAgTGlnaHRHaXptby5fX21lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBMaWdodEdpem1vLl9fbWVzaC5hZGRQcmltaXRpdmUoTGlnaHRHaXptby5fX2dlbmVyYXRlUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUpKTtcbiAgICBtZXNoQ29tcG9uZW50LnNldE1lc2goTGlnaHRHaXptby5fX21lc2gpO1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6ICdHaXptbycsIHZhbHVlOiAnTGlnaHQnIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIChwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlKSBvZiB0aGUgZ2l6bW8gdG8gbWF0Y2ggdGhlIHRhcmdldCBlbnRpdHkuXG4gICAqIFRoZSBnaXptbydzIHBvc2l0aW9uIGlzIHNldCB0byBlaXRoZXIgdGhlIHRhcmdldCdzIHBvc2l0aW9uIG9yIHRoZSBjZW50ZXIgb2YgaXRzIGJvdW5kaW5nIGJveCxcbiAgICogYW5kIGl0cyBzY2FsZSBpcyBhZGp1c3RlZCBiYXNlZCBvbiB0aGUgdGFyZ2V0J3MgYm91bmRpbmcgYm94IHNpemUuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3VwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2cgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKSE7XG4gICAgY29uc3QgYWFiYiA9IHNnLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICBpZiAoYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IHNnLnBvc2l0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbFBvc2l0aW9uID0gYWFiYi5jZW50ZXJQb2ludDtcbiAgICB9XG4gICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxSb3RhdGlvbiA9IHNnLnJvdGF0aW9uO1xuXG4gICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxTY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICBNYXRoLm1heCgxLCBhYWJiLmlzVmFuaWxsYSgpID8gMSA6IGFhYmIuc2l6ZVggLyAyKSxcbiAgICAgIE1hdGgubWF4KDEsIGFhYmIuaXNWYW5pbGxhKCkgPyAxIDogYWFiYi5zaXplWSAvIDIpLFxuICAgICAgTWF0aC5tYXgoMSwgYWFiYi5pc1ZhbmlsbGEoKSA/IDEgOiBhYWJiLnNpemVaIC8gMiksXG4gICAgXSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGdpem1vIGFuZCBjbGVhbnMgdXAgaXRzIHJlc291cmNlcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLl9fZGVzdHJveVRvcEVudGl0eSgpO1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHJpdmF0ZSBTdGF0aWMgTWVtYmVyc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0aGUgcHJpbWl0aXZlIGdlb21ldHJ5IGZvciB0aGUgbGlnaHQgZ2l6bW8gdmlzdWFsaXphdGlvbi5cbiAgICogQ3JlYXRlcyBhIGxpbmUtYmFzZWQgcmVwcmVzZW50YXRpb24gc2hvd2luZyBhIGRpcmVjdGlvbmFsIGFycm93IHBvaW50aW5nIGluIHRoZSBuZWdhdGl2ZSBaIGRpcmVjdGlvbixcbiAgICogd2hpY2ggaXMgY29tbW9ubHkgdXNlZCB0byByZXByZXNlbnQgbGlnaHQgZGlyZWN0aW9uIGluIDNEIGdyYXBoaWNzLlxuICAgKiBAcmV0dXJucyBBIHByaW1pdGl2ZSBvYmplY3QgY29udGFpbmluZyB0aGUgbGluZSBnZW9tZXRyeSBmb3IgdGhlIGxpZ2h0IGdpem1vXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lKTogUHJpbWl0aXZlIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vIFogYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAtdGhpcy5fX2xlbmd0aCxcblxuICAgICAgLy8gQXJyb3dcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgLXRoaXMuX19sZW5ndGgsXG4gICAgICAtMC4xLFxuICAgICAgMCxcbiAgICAgIC10aGlzLl9fbGVuZ3RoICsgMC4yLFxuXG4gICAgICAvLyBBcnJvdyBlbmRcbiAgICAgIC0wLjEsXG4gICAgICAwLFxuICAgICAgLXRoaXMuX19sZW5ndGggKyAwLjIsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIC10aGlzLl9fbGVuZ3RoICsgMC4yLFxuICAgIF0pO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmNyZWF0ZVByaW1pdGl2ZShlbmdpbmUsIHtcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogW1ZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVpdLFxuICAgICAgYXR0cmlidXRlczogW3Bvc2l0aW9uc10sXG4gICAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlLkxpbmVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGVBQWU7QUFFeEIsU0FBUyxhQUFhO0FBRWYsSUFBTSxjQUFOLE1BQU0sb0JBQW1CLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWNw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
