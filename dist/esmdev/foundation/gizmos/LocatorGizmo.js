// src/foundation/gizmos/LocatorGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
import { Gizmo } from "./Gizmo.js";
var _LocatorGizmo = class _LocatorGizmo extends Gizmo {
  ///
  ///
  /// Accessors
  ///
  ///
  /**
   * Gets whether the gizmo has been properly set up and initialized.
   * @returns True if the gizmo is set up, false otherwise
   */
  get isSetup() {
    if (this.pm != null) {
      return true;
    }
    return false;
  }
  /**
   * Sets the length of the axis lines displayed by the gizmo.
   * @param val - The length value for the axis lines
   */
  set length(val) {
    _LocatorGizmo.Lm = val;
  }
  /**
   * Gets the current length of the axis lines displayed by the gizmo.
   * @returns The current axis line length
   */
  get length() {
    return _LocatorGizmo.Lm;
  }
  ///
  ///
  /// Friends Members
  ///
  ///
  /**
   * Sets up the gizmo entities and mesh if not already done.
   * Creates the coordinate axis visualization with colored lines representing X, Y, and Z axes.
   * @internal
   */
  _setup() {
    if (this.rm()) {
      return;
    }
    this.pm = createMeshEntity(this.c);
    this.pm.tryToSetUniqueName(`LocatorGizmo_of_${this.qm.uniqueName}`, true);
    this.pm.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.qm.getSceneGraph()._addGizmoChild(this.pm.getSceneGraph());
    const sceneGraphComponent = this.pm.tryToGetMesh();
    _LocatorGizmo.Rd = new Mesh(this.c);
    _LocatorGizmo.Rd.addPrimitive(_LocatorGizmo.Mm(this.c));
    sceneGraphComponent.setMesh(_LocatorGizmo.Rd);
    this.setGizmoTag();
    this.pm.tryToSetTag({ tag: "Gizmo", value: "Locator" });
  }
  /**
   * Updates the gizmo's transform properties to match the target object.
   * Positions the gizmo at the target's center point and scales it based on the target's bounding box.
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
    this.pm.getTransform().localScale = Vector3.fromCopyArray([
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeX / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeY / 2),
      Math.max(1, aabb.isVanilla() ? 1 : aabb.sizeZ / 2)
    ]);
  }
  ///
  ///
  /// Private Static Members
  ///
  ///
  /**
   * Generates the primitive geometry for the coordinate axes visualization.
   * Creates three colored lines: red for X-axis, green for Y-axis, and blue for Z-axis.
   * @returns The primitive object containing the axis line geometry and colors
   */
  static Mm(engine) {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      this.Lm,
      0,
      0,
      // Y axis
      0,
      0,
      0,
      0,
      this.Lm,
      0,
      // Z axis
      0,
      0,
      0,
      0,
      0,
      this.Lm
    ]);
    const color = new Float32Array([
      // X axis as Red
      1,
      0,
      0,
      1,
      0,
      0,
      // Y axis as Green
      0,
      1,
      0,
      0,
      1,
      0,
      // Z axis as Blue
      0,
      0,
      1,
      0,
      0,
      1
    ]);
    const primitive = Primitive.createPrimitive(engine, {
      attributeSemantics: [VertexAttribute.Position.XYZ, VertexAttribute.Color0.XYZ],
      attributes: [positions, color],
      primitiveMode: PrimitiveMode.Lines
    });
    return primitive;
  }
  /**
   * Destroys the gizmo and cleans up its resources.
   * Removes the gizmo entity and frees associated memory.
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
    _LocatorGizmo.Rd = void 0;
  }
};
_LocatorGizmo.Lm = 1;
var LocatorGizmo = _LocatorGizmo;
export {
  LocatorGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0xvY2F0b3JHaXptby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlTWVzaEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaFJlbmRlcmVyL2NyZWF0ZU1lc2hFbnRpdHknO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBHaXptbyB9IGZyb20gJy4vR2l6bW8nO1xuXG4vKipcbiAqIExvY2F0b3IgR2l6bW8gY2xhc3MgdGhhdCBwcm92aWRlcyB2aXN1YWwgY29vcmRpbmF0ZSBheGVzIGZvciAzRCBvYmplY3RzLlxuICogRGlzcGxheXMgWCAocmVkKSwgWSAoZ3JlZW4pLCBhbmQgWiAoYmx1ZSkgYXhpcyBsaW5lcyB0byBoZWxwIHZpc3VhbGl6ZSBvYmplY3Qgb3JpZW50YXRpb24gYW5kIHBvc2l0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgTG9jYXRvckdpem1vIGV4dGVuZHMgR2l6bW8ge1xuICBwcml2YXRlIHN0YXRpYyBfX21lc2g6IE1lc2g7XG4gIHByaXZhdGUgc3RhdGljIF9fbGVuZ3RoID0gMTtcblxuICAvLy9cbiAgLy8vXG4gIC8vLyBBY2Nlc3NvcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgdGhlIGdpem1vIGhhcyBiZWVuIHByb3Blcmx5IHNldCB1cCBhbmQgaW5pdGlhbGl6ZWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIGdpem1vIGlzIHNldCB1cCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXQgaXNTZXR1cCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fX3RvcEVudGl0eSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGxlbmd0aCBvZiB0aGUgYXhpcyBsaW5lcyBkaXNwbGF5ZWQgYnkgdGhlIGdpem1vLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIGxlbmd0aCB2YWx1ZSBmb3IgdGhlIGF4aXMgbGluZXNcbiAgICovXG4gIHNldCBsZW5ndGgodmFsOiBudW1iZXIpIHtcbiAgICBMb2NhdG9yR2l6bW8uX19sZW5ndGggPSB2YWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBsZW5ndGggb2YgdGhlIGF4aXMgbGluZXMgZGlzcGxheWVkIGJ5IHRoZSBnaXptby5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgYXhpcyBsaW5lIGxlbmd0aFxuICAgKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBMb2NhdG9yR2l6bW8uX19sZW5ndGg7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBGcmllbmRzIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBTZXRzIHVwIHRoZSBnaXptbyBlbnRpdGllcyBhbmQgbWVzaCBpZiBub3QgYWxyZWFkeSBkb25lLlxuICAgKiBDcmVhdGVzIHRoZSBjb29yZGluYXRlIGF4aXMgdmlzdWFsaXphdGlvbiB3aXRoIGNvbG9yZWQgbGluZXMgcmVwcmVzZW50aW5nIFgsIFksIGFuZCBaIGF4ZXMuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3NldHVwKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fdG9Ta2lwU2V0dXAoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX190b3BFbnRpdHkgPSBjcmVhdGVNZXNoRW50aXR5KHRoaXMuX19lbmdpbmUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLnRyeVRvU2V0VW5pcXVlTmFtZShgTG9jYXRvckdpem1vX29mXyR7dGhpcy5fX3RhcmdldC51bmlxdWVOYW1lfWAsIHRydWUpO1xuICAgIHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSEudG9NYWtlV29ybGRNYXRyaXhUaGVTYW1lQXNMb2NhbE1hdHJpeCA9IHRydWU7XG4gICAgdGhpcy5fX3RhcmdldC5nZXRTY2VuZUdyYXBoKCkuX2FkZEdpem1vQ2hpbGQodGhpcy5fX3RvcEVudGl0eSEuZ2V0U2NlbmVHcmFwaCgpKTtcblxuICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSB0aGlzLl9fdG9wRW50aXR5IS50cnlUb0dldE1lc2goKSE7XG4gICAgTG9jYXRvckdpem1vLl9fbWVzaCA9IG5ldyBNZXNoKHRoaXMuX19lbmdpbmUpO1xuICAgIExvY2F0b3JHaXptby5fX21lc2guYWRkUHJpbWl0aXZlKExvY2F0b3JHaXptby5fX2dlbmVyYXRlUHJpbWl0aXZlKHRoaXMuX19lbmdpbmUpKTtcbiAgICBzY2VuZUdyYXBoQ29tcG9uZW50LnNldE1lc2goTG9jYXRvckdpem1vLl9fbWVzaCk7XG5cbiAgICB0aGlzLnNldEdpem1vVGFnKCk7XG4gICAgdGhpcy5fX3RvcEVudGl0eS50cnlUb1NldFRhZyh7IHRhZzogJ0dpem1vJywgdmFsdWU6ICdMb2NhdG9yJyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBnaXptbydzIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIHRvIG1hdGNoIHRoZSB0YXJnZXQgb2JqZWN0LlxuICAgKiBQb3NpdGlvbnMgdGhlIGdpem1vIGF0IHRoZSB0YXJnZXQncyBjZW50ZXIgcG9pbnQgYW5kIHNjYWxlcyBpdCBiYXNlZCBvbiB0aGUgdGFyZ2V0J3MgYm91bmRpbmcgYm94LlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF91cGRhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZyA9IHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpITtcbiAgICBjb25zdCBhYWJiID0gc2cud29ybGRNZXJnZWRBQUJCV2l0aFNrZWxldGFsO1xuICAgIGlmIChhYWJiLmlzVmFuaWxsYSgpKSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbFBvc2l0aW9uID0gc2cucG9zaXRpb247XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX190b3BFbnRpdHkuZ2V0VHJhbnNmb3JtKCkhLmxvY2FsUG9zaXRpb24gPSBhYWJiLmNlbnRlclBvaW50O1xuICAgIH1cbiAgICB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbFNjYWxlID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtcbiAgICAgIE1hdGgubWF4KDEsIGFhYmIuaXNWYW5pbGxhKCkgPyAxIDogYWFiYi5zaXplWCAvIDIpLFxuICAgICAgTWF0aC5tYXgoMSwgYWFiYi5pc1ZhbmlsbGEoKSA/IDEgOiBhYWJiLnNpemVZIC8gMiksXG4gICAgICBNYXRoLm1heCgxLCBhYWJiLmlzVmFuaWxsYSgpID8gMSA6IGFhYmIuc2l6ZVogLyAyKSxcbiAgICBdKTtcbiAgfVxuXG4gIC8vL1xuICAvLy9cbiAgLy8vIFByaXZhdGUgU3RhdGljIE1lbWJlcnNcbiAgLy8vXG4gIC8vL1xuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGhlIHByaW1pdGl2ZSBnZW9tZXRyeSBmb3IgdGhlIGNvb3JkaW5hdGUgYXhlcyB2aXN1YWxpemF0aW9uLlxuICAgKiBDcmVhdGVzIHRocmVlIGNvbG9yZWQgbGluZXM6IHJlZCBmb3IgWC1heGlzLCBncmVlbiBmb3IgWS1heGlzLCBhbmQgYmx1ZSBmb3IgWi1heGlzLlxuICAgKiBAcmV0dXJucyBUaGUgcHJpbWl0aXZlIG9iamVjdCBjb250YWluaW5nIHRoZSBheGlzIGxpbmUgZ2VvbWV0cnkgYW5kIGNvbG9yc1xuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19nZW5lcmF0ZVByaW1pdGl2ZShlbmdpbmU6IEVuZ2luZSk6IFByaW1pdGl2ZSB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAvLyBYIGF4aXNcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHRoaXMuX19sZW5ndGgsXG4gICAgICAwLFxuICAgICAgMCxcblxuICAgICAgLy8gWSBheGlzXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2xlbmd0aCxcbiAgICAgIDAsXG5cbiAgICAgIC8vIFogYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICB0aGlzLl9fbGVuZ3RoLFxuICAgIF0pO1xuXG4gICAgY29uc3QgY29sb3IgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIC8vIFggYXhpcyBhcyBSZWRcbiAgICAgIDEsIDAsIDAsIDEsIDAsIDAsXG5cbiAgICAgIC8vIFkgYXhpcyBhcyBHcmVlblxuICAgICAgMCwgMSwgMCwgMCwgMSwgMCxcblxuICAgICAgLy8gWiBheGlzIGFzIEJsdWVcbiAgICAgIDAsIDAsIDEsIDAsIDAsIDEsXG4gICAgXSk7XG5cbiAgICBjb25zdCBwcmltaXRpdmUgPSBQcmltaXRpdmUuY3JlYXRlUHJpbWl0aXZlKGVuZ2luZSwge1xuICAgICAgYXR0cmlidXRlU2VtYW50aWNzOiBbVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWiwgVmVydGV4QXR0cmlidXRlLkNvbG9yMC5YWVpdLFxuICAgICAgYXR0cmlidXRlczogW3Bvc2l0aW9ucywgY29sb3JdLFxuICAgICAgcHJpbWl0aXZlTW9kZTogUHJpbWl0aXZlTW9kZS5MaW5lcyxcbiAgICB9KTtcblxuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGdpem1vIGFuZCBjbGVhbnMgdXAgaXRzIHJlc291cmNlcy5cbiAgICogUmVtb3ZlcyB0aGUgZ2l6bW8gZW50aXR5IGFuZCBmcmVlcyBhc3NvY2lhdGVkIG1lbW9yeS5cbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX19kZXN0cm95VG9wRW50aXR5KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIGFsbCBzdGF0aWMgcmVzb3VyY2VzIGZvciBhIHNwZWNpZmljIEVuZ2luZS5cbiAgICogVGhpcyByZXNldHMgc3RhdGljIG1lbWJlcnMgc28gdGhhdCBnaXptb3MgY2FuIGJlIHJlY3JlYXRlZCB3aXRoIGEgbmV3IEVuZ2luZS5cbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIEVuZ2luZS5kZXN0cm95KClcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShfZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBMb2NhdG9yR2l6bW8uX19tZXNoID0gdW5kZWZpbmVkIGFzIGFueTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGVBQWU7QUFFeEIsU0FBUyxhQUFhO0FBTWYsSUFBTSxnQkFBTixNQUFNLHNCQUFxQixNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFjdEMsSUFBSSxVQUFtQjtBQUNyQixRQUFJLEtBQUtBLE1BQWUsTUFBTTtBQUM1QixhQUFPO0FBQUEsSUFDVDtBQUNBLFdB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LG9CQUFvQixDQUFDLGdCQUFnQixTQUFTLEtBQUssZ0JBQWdCLE9BQU8sR0FBRztBQUFBLE1BQzdFLFlBQVksQ0FBQyxXQUFXLEtBQUs7QUFBQSxNQUM3QixlQUFlLGNBQWM7QUFBQSxJQUMvQixDQUFDO0FBRUQsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsV0FBaUI7QUFDZixTQUFLTSxHQUFtQjtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxrQkFBa0IsU0FBdUI7QUFDOUMsa0JBQWFGLEtBQVM7QUFBQSxFQUN4QjtBQUNGO0FBcEthLGNBRUlKLEtBQVc7QUFGckIsSUFBTSxlQUFOOyIsCiAgIm5hbWVzIjogWyJfX3RvcEVudGl0eSIsICJfX2xlbmd0aCIsICJfX3RvU2tpcFNldHVwIiwgIl9fZW5naW5lIiwgIl9fdGFyZ2V0IiwgIl9fbWVzaCIsICJfX2dlbmVyYXRlUHJpbWl0aXZlIiwgIl9fZGVzdHJveVRvcEVudGl0eSJdCn0K
