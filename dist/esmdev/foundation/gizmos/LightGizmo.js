// src/foundation/gizmos/LightGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
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
   * Initializes the gizmo entities and visual representation if not already done.
   * Creates a mesh entity with a light gizmo primitive and attaches it to the target entity.
   * @internal
   */
  _setup() {
    if (this.km()) {
      return;
    }
    this.im = createMeshEntity(this.c);
    this.im.tryToSetUniqueName(`LightGizmo_of_${this.jm.uniqueName}`, true);
    this.im.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.jm.getSceneGraph()._addGizmoChild(this.im.getSceneGraph());
    const meshComponent = this.im.tryToGetMesh();
    _LightGizmo.Nd = new Mesh(this.c);
    _LightGizmo.Nd.addPrimitive(_LightGizmo.Em(this.c));
    meshComponent.setMesh(_LightGizmo.Nd);
    this.setGizmoTag();
    this.im.tryToSetTag({ tag: "Gizmo", value: "Light" });
  }
  /**
   * Updates the transform properties (position, rotation, scale) of the gizmo to match the target entity.
   * The gizmo's position is set to either the target's position or the center of its bounding box,
   * and its scale is adjusted based on the target's bounding box size.
   * @internal
   */
  _update() {
    if (this.im == null) {
      return;
    }
    const sg = this.jm.getSceneGraph();
    const aabb = sg.worldMergedAABBWithSkeletal;
    if (aabb.isVanilla()) {
      this.im.getTransform().localPosition = sg.position;
    } else {
      this.im.getTransform().localPosition = aabb.centerPoint;
    }
    this.im.getTransform().localRotation = sg.rotation;
    this.im.getTransform().localScale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2)
    ]);
  }
  /**
   * Destroys the gizmo and cleans up its resources.
   * Removes the top entity and all associated components from the scene.
   * @internal
   */
  _destroy() {
    if (Is.exist(this.im)) {
      this.im._destroy();
    }
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
  static Em(engine) {
    const positions = new Float32Array([
      // Z axis
      0,
      0,
      0,
      0,
      0,
      -this.Dm,
      // Arrow
      0,
      0,
      -this.Dm,
      -0.1,
      0,
      -this.Dm + 0.2,
      // Arrow end
      -0.1,
      0,
      -this.Dm + 0.2,
      0,
      0,
      -this.Dm + 0.2
    ]);
    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics: [VertexAttribute.Position.XYZ],
      attributes: [positions],
      primitiveMode: PrimitiveMode.Lines
    });
    return primitive;
  }
};
_LightGizmo.Dm = 1;
var LightGizmo = _LightGizmo;
export {
  LightGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0xpZ2h0R2l6bW8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZU1lc2hFbnRpdHkgfSBmcm9tICcuLi9jb21wb25lbnRzL01lc2hSZW5kZXJlci9jcmVhdGVNZXNoRW50aXR5JztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSAnLi4vZ2VvbWV0cnkvTWVzaCc7XG5pbXBvcnQgeyBQcmltaXRpdmUgfSBmcm9tICcuLi9nZW9tZXRyeS9QcmltaXRpdmUnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB7IEdpem1vIH0gZnJvbSAnLi9HaXptbyc7XG5cbmV4cG9ydCBjbGFzcyBMaWdodEdpem1vIGV4dGVuZHMgR2l6bW8ge1xuICBwcml2YXRlIHN0YXRpYyBfX21lc2g6IE1lc2g7XG4gIHByaXZhdGUgc3RhdGljIF9fbGVuZ3RoID0gMTtcblxuICAvLy9cbiAgLy8vXG4gIC8vLyBBY2Nlc3NvcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l6bW8gaGFzIGJlZW4gcHJvcGVybHkgaW5pdGlhbGl6ZWQgYW5kIHNldCB1cC5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgZ2l6bW8ncyB0b3AgZW50aXR5IGV4aXN0cyBhbmQgc2V0dXAgaXMgY29tcGxldGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzU2V0dXAoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIEZyaWVuZHMgTWVtYmVyc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBnaXptbyBlbnRpdGllcyBhbmQgdmlzdWFsIHJlcHJlc2VudGF0aW9uIGlmIG5vdCBhbHJlYWR5IGRvbmUuXG4gICAqIENyZWF0ZXMgYSBtZXNoIGVudGl0eSB3aXRoIGEgbGlnaHQgZ2l6bW8gcHJpbWl0aXZlIGFuZCBhdHRhY2hlcyBpdCB0byB0aGUgdGFyZ2V0IGVudGl0eS5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfc2V0dXAoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX190b1NraXBTZXR1cCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fX3RvcEVudGl0eSA9IGNyZWF0ZU1lc2hFbnRpdHkodGhpcy5fX2VuZ2luZSk7XG4gICAgdGhpcy5fX3RvcEVudGl0eS50cnlUb1NldFVuaXF1ZU5hbWUoYExpZ2h0R2l6bW9fb2ZfJHt0aGlzLl9fdGFyZ2V0LnVuaXF1ZU5hbWV9YCwgdHJ1ZSk7XG4gICAgdGhpcy5fX3RvcEVudGl0eS5nZXRTY2VuZUdyYXBoKCkhLnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggPSB0cnVlO1xuICAgIHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSk7XG5cbiAgICBjb25zdCBtZXNoQ29tcG9uZW50ID0gdGhpcy5fX3RvcEVudGl0eSEudHJ5VG9HZXRNZXNoKCkhO1xuICAgIExpZ2h0R2l6bW8uX19tZXNoID0gbmV3IE1lc2godGhpcy5fX2VuZ2luZSk7XG4gICAgTGlnaHRHaXptby5fX21lc2guYWRkUHJpbWl0aXZlKExpZ2h0R2l6bW8uX19nZW5lcmF0ZVByaW1pdGl2ZSh0aGlzLl9fZW5naW5lKSk7XG4gICAgbWVzaENvbXBvbmVudC5zZXRNZXNoKExpZ2h0R2l6bW8uX19tZXNoKTtcblxuICAgIHRoaXMuc2V0R2l6bW9UYWcoKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5LnRyeVRvU2V0VGFnKHsgdGFnOiAnR2l6bW8nLCB2YWx1ZTogJ0xpZ2h0JyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB0cmFuc2Zvcm0gcHJvcGVydGllcyAocG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSkgb2YgdGhlIGdpem1vIHRvIG1hdGNoIHRoZSB0YXJnZXQgZW50aXR5LlxuICAgKiBUaGUgZ2l6bW8ncyBwb3NpdGlvbiBpcyBzZXQgdG8gZWl0aGVyIHRoZSB0YXJnZXQncyBwb3NpdGlvbiBvciB0aGUgY2VudGVyIG9mIGl0cyBib3VuZGluZyBib3gsXG4gICAqIGFuZCBpdHMgc2NhbGUgaXMgYWRqdXN0ZWQgYmFzZWQgb24gdGhlIHRhcmdldCdzIGJvdW5kaW5nIGJveCBzaXplLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF91cGRhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNnID0gdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkhO1xuICAgIGNvbnN0IGFhYmIgPSBzZy53b3JsZE1lcmdlZEFBQkJXaXRoU2tlbGV0YWw7XG4gICAgaWYgKGFhYmIuaXNWYW5pbGxhKCkpIHtcbiAgICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsUG9zaXRpb24gPSBzZy5wb3NpdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IGFhYmIuY2VudGVyUG9pbnQ7XG4gICAgfVxuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsUm90YXRpb24gPSBzZy5yb3RhdGlvbjtcblxuICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsU2NhbGUgPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW1xuICAgICAgTWF0aC5tYXgoMSwgYWFiYi5pc1ZhbmlsbGEoKSA/IDEgOiBhYWJiLnNpemVYIC8gMiksXG4gICAgICBNYXRoLm1heCgxLCBhYWJiLmlzVmFuaWxsYSgpID8gMSA6IGFhYmIuc2l6ZVkgLyAyKSxcbiAgICAgIE1hdGgubWF4KDEsIGFhYmIuaXNWYW5pbGxhKCkgPyAxIDogYWFiYi5zaXplWiAvIDIpLFxuICAgIF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBnaXptbyBhbmQgY2xlYW5zIHVwIGl0cyByZXNvdXJjZXMuXG4gICAqIFJlbW92ZXMgdGhlIHRvcCBlbnRpdHkgYW5kIGFsbCBhc3NvY2lhdGVkIGNvbXBvbmVudHMgZnJvbSB0aGUgc2NlbmUuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKElzLmV4aXN0KHRoaXMuX190b3BFbnRpdHkpKSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5Ll9kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gUHJpdmF0ZSBTdGF0aWMgTWVtYmVyc1xuICAvLy9cbiAgLy8vXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyB0aGUgcHJpbWl0aXZlIGdlb21ldHJ5IGZvciB0aGUgbGlnaHQgZ2l6bW8gdmlzdWFsaXphdGlvbi5cbiAgICogQ3JlYXRlcyBhIGxpbmUtYmFzZWQgcmVwcmVzZW50YXRpb24gc2hvd2luZyBhIGRpcmVjdGlvbmFsIGFycm93IHBvaW50aW5nIGluIHRoZSBuZWdhdGl2ZSBaIGRpcmVjdGlvbixcbiAgICogd2hpY2ggaXMgY29tbW9ubHkgdXNlZCB0byByZXByZXNlbnQgbGlnaHQgZGlyZWN0aW9uIGluIDNEIGdyYXBoaWNzLlxuICAgKiBAcmV0dXJucyBBIHByaW1pdGl2ZSBvYmplY3QgY29udGFpbmluZyB0aGUgbGluZSBnZW9tZXRyeSBmb3IgdGhlIGxpZ2h0IGdpem1vXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2dlbmVyYXRlUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lKTogUHJpbWl0aXZlIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vIFogYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAtdGhpcy5fX2xlbmd0aCxcblxuICAgICAgLy8gQXJyb3dcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgLXRoaXMuX19sZW5ndGgsXG4gICAgICAtMC4xLFxuICAgICAgMCxcbiAgICAgIC10aGlzLl9fbGVuZ3RoICsgMC4yLFxuXG4gICAgICAvLyBBcnJvdyBlbmRcbiAgICAgIC0wLjEsXG4gICAgICAwLFxuICAgICAgLXRoaXMuX19sZW5ndGggKyAwLjIsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIC10aGlzLl9fbGVuZ3RoICsgMC4yLFxuICAgIF0pO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmNyZWF0ZVByaW1pdGl2ZShlbmdpbmUsIHtcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogW1ZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVpdLFxuICAgICAgYXR0cmlidXRlczogW3Bvc2l0aW9uc10sXG4gICAgICBwcmltaXRpdmVNb2RlOiBQcmltaXRpdmVNb2RlLkxpbmVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxVQUFVO0FBRW5CLFNBQVMsYUFBYTtBQUVmLElBQU0sY0FBTixNQUFNLG9CQUFtQixNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjcEMsSUFBSSxVQUFtQjtBQUNyQixRQUFJLEtBQUtBLE1BQWUsTUFBTTtBQUM1QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLFNBQWU7QUFDYixRQUFJLEtBQUtDLEdBQWMsR0FBRztBQUN4QjtBQUFBLElBQ0Y7QUFFQSxTQUFLRCxLQUFjLGlCQUFpQixLQUFLRSxDQUFRO0FBQ2pELFNBQUtGLEdBQVksbUJBQW1CLGlCQUFpQixLQUFLRyxHQUFTLFVBQVUsSUFBSSxJQUFJO0FBQ3JGLFNBQUtILEdBQVksY0FBYyxFQUFHLHdDQUF3QztBQUMxRSxTQUFLRyxHQUFTLGNBQWMsRUFBRSxlQUFlLEtBQUtILEdBQWEsY0FBYyxDQUFDO0FBRTlFLFVBQU0sZ0JBQWdCLEtBQUtBLEdBQWEsYUFBYTtBQUNyRCxnQkFBV0ksS0FBUyxJQUFJLEtBQUssS0FBS0YsQ0FBUTtBQUMxQyxnQkFBV0UsR0FBTyxhQUFhLFlBQVdDLEdBQW9CLEtBQUtILENBQVEsQ0FBQztBQUM1RSxrQkFBYyxRQUFRLFlBQVdFLEVBQU07QUFFdkMsU0FBSyxZQUFZO0FBQ2pCLFNBQUtKLEdBQVksWUFBWSxFQUFFLEtBQUssU0FBUyxPQUFPLFFBQVEsQ0FBQztBQUFBLEVBQy9EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxVQUFnQjtBQUNkLFFBQUksS0FBS0EsTUFBZSxNQUFNO0FBQzVCO0FBQUEsSUFDRjtBQUVBLFVBQU0sS0FBSyxLQUFLRyxHQUFTLGNBQWM7QUFDdkMsVUFBTSxPQUFPLEdBQUc7QUFDaEIsUUFBSSxLQUFLLFVBQVUsR0FBRztBQUNwQixXQUFLSCxHQUFZLGFBQWEsRUFBRyxnQkFBZ0IsR0FBRztBQUFBLElBQ3RELE9BQU87QUFDTCxXQUFLQSxHQUFZLGFBQWEsRUFBRyxnQkFBZ0IsS0FBSztBQUFBLElBQ3hEO0FBQ0EsU0FBS0EsR0FBWSxhQUFhLEVBQUcsZ0JBQWdCLEdBQUc7QUFFcEQsU0FBS0EsR0FBWSxhQUFhLEVBQUcsYUFBYSxRQUFRLGNBQWM7QUFBQSxNQUNsRSxLQUFLLElBQUksR0FBRyxLQUFLLFVBQVUsSUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDO0FBQUEsTUFDakQsS0FBSyxJQUFJLEdBQUcsS0FBSyxVQUFVLElBQUksSUFBSSxLQUFLLFFBQVEsQ0FBQztBQUFBLE1BQ2pELEtBQUssSUFBSSxHQUFHLEtBQUssVUFBVSxJQUFJLElBQUksS0FBSyxRQUFRLENBQUM7QUFBQSxJQUNuRCxDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQWlCO0FBQ2YsUUFBSSxHQUFHLE1BQU0sS0FBS0EsRUFBVyxHQUFHO0FBQzlCLFdBQUtBLEdBQVksU0FBUztBQUFBLElBQzVCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZUEsT0FBZUssR0FBb0IsUUFBMkI7QUFDNUQsVUFBTSxZQUFZLElBQUksYUFBYTtBQUFBO0FBQUEsTUFFakM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxDQUFDLEtBQUtDO0FBQUE7QUFBQSxNQUdOO0FBQUEsTUFDQTtBQUFBLE1BQ0EsQ0FBQyxLQUFLQTtBQUFBLE1BQ047QUFBQSxNQUNBO0FBQUEsTUFDQSxDQUFDLEtBQUtBLEtBQVc7QUFBQTtBQUFBLE1BR2pCO0FBQUEsTUFDQTtBQUFBLE1BQ0EsQ0FBQyxLQUFLQSxLQUFXO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsTUFDQSxDQUFDLEtBQUtBLEtBQVc7QUFBQSxJQUNuQixDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsZ0JBQWdCLFFBQVE7QUFBQSxNQUNsRCxvQkFBb0IsQ0FBQyxnQkFBZ0IsU0FBUyxHQUFHO0FBQUEsTUFDakQsWUFBWSxDQUFDLFNBQVM7QUFBQSxNQUN0QixlQUFlLGNBQWM7QUFBQSxJQUMvQixDQUFDO0FBRUQsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQXpJYSxZQUVJQSxLQUFXO0FBRnJCLElBQU0sYUFBTjsiLAogICJuYW1lcyI6IFsiX190b3BFbnRpdHkiLCAiX190b1NraXBTZXR1cCIsICJfX2VuZ2luZSIsICJfX3RhcmdldCIsICJfX21lc2giLCAiX19nZW5lcmF0ZVByaW1pdGl2ZSIsICJfX2xlbmd0aCJdCn0K
