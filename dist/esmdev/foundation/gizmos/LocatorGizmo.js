// src/foundation/gizmos/LocatorGizmo.ts
import { createMeshEntity } from "../components/MeshRenderer/createMeshEntity.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { Mesh } from "../geometry/Mesh.js";
import { Primitive } from "../geometry/Primitive.js";
import { Vector3 } from "../math/Vector3.js";
import { Is } from "../misc/Is.js";
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
    if (this.im != null) {
      return true;
    }
    return false;
  }
  /**
   * Sets the length of the axis lines displayed by the gizmo.
   * @param val - The length value for the axis lines
   */
  set length(val) {
    _LocatorGizmo.Dm = val;
  }
  /**
   * Gets the current length of the axis lines displayed by the gizmo.
   * @returns The current axis line length
   */
  get length() {
    return _LocatorGizmo.Dm;
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
    if (this.km()) {
      return;
    }
    this.im = createMeshEntity(this.c);
    this.im.tryToSetUniqueName(`LocatorGizmo_of_${this.jm.uniqueName}`, true);
    this.im.getSceneGraph().toMakeWorldMatrixTheSameAsLocalMatrix = true;
    this.jm.getSceneGraph()._addGizmoChild(this.im.getSceneGraph());
    const sceneGraphComponent = this.im.tryToGetMesh();
    _LocatorGizmo.Nd = new Mesh(this.c);
    _LocatorGizmo.Nd.addPrimitive(_LocatorGizmo.Em(this.c));
    sceneGraphComponent.setMesh(_LocatorGizmo.Nd);
    this.setGizmoTag();
    this.im.tryToSetTag({ tag: "Gizmo", value: "Locator" });
  }
  /**
   * Updates the gizmo's transform properties to match the target object.
   * Positions the gizmo at the target's center point and scales it based on the target's bounding box.
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
    this.im.getTransform().localScale = Vector3.fromCopyArray([
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
  static Em(engine) {
    const positions = new Float32Array([
      // X axis
      0,
      0,
      0,
      this.Dm,
      0,
      0,
      // Y axis
      0,
      0,
      0,
      0,
      this.Dm,
      0,
      // Z axis
      0,
      0,
      0,
      0,
      0,
      this.Dm
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
    _LocatorGizmo.Nd = void 0;
  }
};
_LocatorGizmo.Dm = 1;
var LocatorGizmo = _LocatorGizmo;
export {
  LocatorGizmo
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2l6bW9zL0xvY2F0b3JHaXptby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlTWVzaEVudGl0eSB9IGZyb20gJy4uL2NvbXBvbmVudHMvTWVzaFJlbmRlcmVyL2NyZWF0ZU1lc2hFbnRpdHknO1xuaW1wb3J0IHsgUHJpbWl0aXZlTW9kZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1ByaW1pdGl2ZU1vZGUnO1xuaW1wb3J0IHsgVmVydGV4QXR0cmlidXRlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB7IE1lc2ggfSBmcm9tICcuLi9nZW9tZXRyeS9NZXNoJztcbmltcG9ydCB7IFByaW1pdGl2ZSB9IGZyb20gJy4uL2dlb21ldHJ5L1ByaW1pdGl2ZSc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi4vbWF0aC9WZWN0b3IzJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uL3N5c3RlbS9FbmdpbmUnO1xuaW1wb3J0IHsgR2l6bW8gfSBmcm9tICcuL0dpem1vJztcblxuLyoqXG4gKiBMb2NhdG9yIEdpem1vIGNsYXNzIHRoYXQgcHJvdmlkZXMgdmlzdWFsIGNvb3JkaW5hdGUgYXhlcyBmb3IgM0Qgb2JqZWN0cy5cbiAqIERpc3BsYXlzIFggKHJlZCksIFkgKGdyZWVuKSwgYW5kIFogKGJsdWUpIGF4aXMgbGluZXMgdG8gaGVscCB2aXN1YWxpemUgb2JqZWN0IG9yaWVudGF0aW9uIGFuZCBwb3NpdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIExvY2F0b3JHaXptbyBleHRlbmRzIEdpem1vIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX19tZXNoOiBNZXNoO1xuICBwcml2YXRlIHN0YXRpYyBfX2xlbmd0aCA9IDE7XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gQWNjZXNzb3JzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogR2V0cyB3aGV0aGVyIHRoZSBnaXptbyBoYXMgYmVlbiBwcm9wZXJseSBzZXQgdXAgYW5kIGluaXRpYWxpemVkLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbyBpcyBzZXQgdXAsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0IGlzU2V0dXAoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuX190b3BFbnRpdHkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBsZW5ndGggb2YgdGhlIGF4aXMgbGluZXMgZGlzcGxheWVkIGJ5IHRoZSBnaXptby5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSBsZW5ndGggdmFsdWUgZm9yIHRoZSBheGlzIGxpbmVzXG4gICAqL1xuICBzZXQgbGVuZ3RoKHZhbDogbnVtYmVyKSB7XG4gICAgTG9jYXRvckdpem1vLl9fbGVuZ3RoID0gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbGVuZ3RoIG9mIHRoZSBheGlzIGxpbmVzIGRpc3BsYXllZCBieSB0aGUgZ2l6bW8uXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IGF4aXMgbGluZSBsZW5ndGhcbiAgICovXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gTG9jYXRvckdpem1vLl9fbGVuZ3RoO1xuICB9XG5cbiAgLy8vXG4gIC8vL1xuICAvLy8gRnJpZW5kcyBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogU2V0cyB1cCB0aGUgZ2l6bW8gZW50aXRpZXMgYW5kIG1lc2ggaWYgbm90IGFscmVhZHkgZG9uZS5cbiAgICogQ3JlYXRlcyB0aGUgY29vcmRpbmF0ZSBheGlzIHZpc3VhbGl6YXRpb24gd2l0aCBjb2xvcmVkIGxpbmVzIHJlcHJlc2VudGluZyBYLCBZLCBhbmQgWiBheGVzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9zZXR1cCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX3RvU2tpcFNldHVwKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9fdG9wRW50aXR5ID0gY3JlYXRlTWVzaEVudGl0eSh0aGlzLl9fZW5naW5lKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5IS50cnlUb1NldFVuaXF1ZU5hbWUoYExvY2F0b3JHaXptb19vZl8ke3RoaXMuX190YXJnZXQudW5pcXVlTmFtZX1gLCB0cnVlKTtcbiAgICB0aGlzLl9fdG9wRW50aXR5IS5nZXRTY2VuZUdyYXBoKCkhLnRvTWFrZVdvcmxkTWF0cml4VGhlU2FtZUFzTG9jYWxNYXRyaXggPSB0cnVlO1xuICAgIHRoaXMuX190YXJnZXQuZ2V0U2NlbmVHcmFwaCgpLl9hZGRHaXptb0NoaWxkKHRoaXMuX190b3BFbnRpdHkhLmdldFNjZW5lR3JhcGgoKSk7XG5cbiAgICBjb25zdCBzY2VuZUdyYXBoQ29tcG9uZW50ID0gdGhpcy5fX3RvcEVudGl0eSEudHJ5VG9HZXRNZXNoKCkhO1xuICAgIExvY2F0b3JHaXptby5fX21lc2ggPSBuZXcgTWVzaCh0aGlzLl9fZW5naW5lKTtcbiAgICBMb2NhdG9yR2l6bW8uX19tZXNoLmFkZFByaW1pdGl2ZShMb2NhdG9yR2l6bW8uX19nZW5lcmF0ZVByaW1pdGl2ZSh0aGlzLl9fZW5naW5lKSk7XG4gICAgc2NlbmVHcmFwaENvbXBvbmVudC5zZXRNZXNoKExvY2F0b3JHaXptby5fX21lc2gpO1xuXG4gICAgdGhpcy5zZXRHaXptb1RhZygpO1xuICAgIHRoaXMuX190b3BFbnRpdHkudHJ5VG9TZXRUYWcoeyB0YWc6ICdHaXptbycsIHZhbHVlOiAnTG9jYXRvcicgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZ2l6bW8ncyB0cmFuc2Zvcm0gcHJvcGVydGllcyB0byBtYXRjaCB0aGUgdGFyZ2V0IG9iamVjdC5cbiAgICogUG9zaXRpb25zIHRoZSBnaXptbyBhdCB0aGUgdGFyZ2V0J3MgY2VudGVyIHBvaW50IGFuZCBzY2FsZXMgaXQgYmFzZWQgb24gdGhlIHRhcmdldCdzIGJvdW5kaW5nIGJveC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdXBkYXRlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9fdG9wRW50aXR5ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2cgPSB0aGlzLl9fdGFyZ2V0LmdldFNjZW5lR3JhcGgoKSE7XG4gICAgY29uc3QgYWFiYiA9IHNnLndvcmxkTWVyZ2VkQUFCQldpdGhTa2VsZXRhbDtcbiAgICBpZiAoYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxQb3NpdGlvbiA9IHNnLnBvc2l0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fdG9wRW50aXR5LmdldFRyYW5zZm9ybSgpIS5sb2NhbFBvc2l0aW9uID0gYWFiYi5jZW50ZXJQb2ludDtcbiAgICB9XG4gICAgdGhpcy5fX3RvcEVudGl0eS5nZXRUcmFuc2Zvcm0oKSEubG9jYWxTY2FsZSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgICBNYXRoLm1heCgxLCBhYWJiLmlzVmFuaWxsYSgpID8gMSA6IGFhYmIuc2l6ZVggLyAyKSxcbiAgICAgIE1hdGgubWF4KDEsIGFhYmIuaXNWYW5pbGxhKCkgPyAxIDogYWFiYi5zaXplWSAvIDIpLFxuICAgICAgTWF0aC5tYXgoMSwgYWFiYi5pc1ZhbmlsbGEoKSA/IDEgOiBhYWJiLnNpemVaIC8gMiksXG4gICAgXSk7XG4gIH1cblxuICAvLy9cbiAgLy8vXG4gIC8vLyBQcml2YXRlIFN0YXRpYyBNZW1iZXJzXG4gIC8vL1xuICAvLy9cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHRoZSBwcmltaXRpdmUgZ2VvbWV0cnkgZm9yIHRoZSBjb29yZGluYXRlIGF4ZXMgdmlzdWFsaXphdGlvbi5cbiAgICogQ3JlYXRlcyB0aHJlZSBjb2xvcmVkIGxpbmVzOiByZWQgZm9yIFgtYXhpcywgZ3JlZW4gZm9yIFktYXhpcywgYW5kIGJsdWUgZm9yIFotYXhpcy5cbiAgICogQHJldHVybnMgVGhlIHByaW1pdGl2ZSBvYmplY3QgY29udGFpbmluZyB0aGUgYXhpcyBsaW5lIGdlb21ldHJ5IGFuZCBjb2xvcnNcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fZ2VuZXJhdGVQcmltaXRpdmUoZW5naW5lOiBFbmdpbmUpOiBQcmltaXRpdmUge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgLy8gWCBheGlzXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICB0aGlzLl9fbGVuZ3RoLFxuICAgICAgMCxcbiAgICAgIDAsXG5cbiAgICAgIC8vIFkgYXhpc1xuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIHRoaXMuX19sZW5ndGgsXG4gICAgICAwLFxuXG4gICAgICAvLyBaIGF4aXNcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgMCxcbiAgICAgIDAsXG4gICAgICAwLFxuICAgICAgdGhpcy5fX2xlbmd0aCxcbiAgICBdKTtcblxuICAgIGNvbnN0IGNvbG9yID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAvLyBYIGF4aXMgYXMgUmVkXG4gICAgICAxLCAwLCAwLCAxLCAwLCAwLFxuXG4gICAgICAvLyBZIGF4aXMgYXMgR3JlZW5cbiAgICAgIDAsIDEsIDAsIDAsIDEsIDAsXG5cbiAgICAgIC8vIFogYXhpcyBhcyBCbHVlXG4gICAgICAwLCAwLCAxLCAwLCAwLCAxLFxuICAgIF0pO1xuXG4gICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmNyZWF0ZVByaW1pdGl2ZShlbmdpbmUsIHtcbiAgICAgIGF0dHJpYnV0ZVNlbWFudGljczogW1ZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVosIFZlcnRleEF0dHJpYnV0ZS5Db2xvcjAuWFlaXSxcbiAgICAgIGF0dHJpYnV0ZXM6IFtwb3NpdGlvbnMsIGNvbG9yXSxcbiAgICAgIHByaW1pdGl2ZU1vZGU6IFByaW1pdGl2ZU1vZGUuTGluZXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBnaXptbyBhbmQgY2xlYW5zIHVwIGl0cyByZXNvdXJjZXMuXG4gICAqIFJlbW92ZXMgdGhlIGdpem1vIGVudGl0eSBhbmQgZnJlZXMgYXNzb2NpYXRlZCBtZW1vcnkuXG4gICAqL1xuICBfZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX3RvcEVudGl0eSkpIHtcbiAgICAgIHRoaXMuX190b3BFbnRpdHkuX2Rlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIGFsbCBzdGF0aWMgcmVzb3VyY2VzIGZvciBhIHNwZWNpZmljIEVuZ2luZS5cbiAgICogVGhpcyByZXNldHMgc3RhdGljIG1lbWJlcnMgc28gdGhhdCBnaXptb3MgY2FuIGJlIHJlY3JlYXRlZCB3aXRoIGEgbmV3IEVuZ2luZS5cbiAgICogQGludGVybmFsIENhbGxlZCBmcm9tIEVuZ2luZS5kZXN0cm95KClcbiAgICovXG4gIHN0YXRpYyBfY2xlYW51cEZvckVuZ2luZShfZW5naW5lOiBFbmdpbmUpOiB2b2lkIHtcbiAgICBMb2NhdG9yR2l6bW8uX19tZXNoID0gdW5kZWZpbmVkIGFzIGFueTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMsd0JBQXdCO0FBQ2pDLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsWUFBWTtBQUNyQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxVQUFVO0FBRW5CLFNBQVMsYUFBYTtBQU1mLElBQU0sZ0JBQU4sTUFBTSxzQkFBcUIsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBY3RDLElBQUksVUFBbUI7QUFDckIsUUFBSSxLQUFLQSxNQUFlLE1BQU07QUFDNUIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLE9BQU8sS0FBYTtBQUN0QixrQkFBYUMsS0FBVztBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksU0FBaUI7QUFDbkIsV0FBTyxjQUFhQTtBQUFBLEVBQ3RCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLFNBQWU7QUFDYixRQUFJLEtBQUtDLEdBQWMsR0FBRztBQUN4QjtBQUFBLElBQ0Y7QUFFQSxTQUFLRixLQUFjLGlCQUFpQixLQUFLRyxDQUFRO0FBQ2pELFNBQUtILEdBQWEsbUJBQW1CLG1CQUFtQixLQUFLSSxHQUFTLFVBQVUsSUFBSSxJQUFJO0FBQ3hGLFNBQUtKLEdBQWEsY0FBYyxFQUFHLHdDQUF3QztBQUMzRSxTQUFLSSxHQUFTLGNBQWMsRUFBRSxlQUFlLEtBQUtKLEdBQWEsY0FBYyxDQUFDO0FBRTlFLFVBQU0sc0JBQXNCLEtBQUtBLEdBQWEsYUFBYTtBQUMzRCxrQkFBYUssS0FBUyxJQUFJLEtBQUssS0FBS0YsQ0FBUTtBQUM1QyxrQkFBYUUsR0FBTyxhQUFhLGNBQWFDLEdBQW9CLEtBQUtILENBQVEsQ0FBQztBQUNoRix3QkFBb0IsUUFBUSxjQUFhRSxFQUFNO0FBRS9DLFNBQUssWUFBWTtBQUNqQixTQUFLTCxHQUFZLFlBQVksRUFBRSxLQUFLLFNBQVMsT0FBTyxVQUFVLENBQUM7QUFBQSxFQUNqRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFVBQWdCO0FBQ2QsUUFBSSxLQUFLQSxNQUFlLE1BQU07QUFDNUI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxLQUFLLEtBQUtJLEdBQVMsY0FBYztBQUN2QyxVQUFNLE9BQU8sR0FBRztBQUNoQixRQUFJLEtBQUssVUFBVSxHQUFHO0FBQ3BCLFdBQUtKLEdBQVksYUFBYSxFQUFHLGdCQUFnQixHQUFHO0FBQUEsSUFDdEQsT0FBTztBQUNMLFdBQUtBLEdBQVksYUFBYSxFQUFHLGdCQUFnQixLQUFLO0FBQUEsSUFDeEQ7QUFDQSxTQUFLQSxHQUFZLGFBQWEsRUFBRyxhQUFhLFFBQVEsY0FBYztBQUFBLE1BQ2xFLEtBQUssSUFBSSxHQUFHLEtBQUssVUFBVSxJQUFJLElBQUksS0FBSyxRQUFRLENBQUM7QUFBQSxNQUNqRCxLQUFLLElBQUksR0FBRyxLQUFLLFVBQVUsSUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDO0FBQUEsTUFDakQsS0FBSyxJQUFJLEdBQUcsS0FBSyxVQUFVLElBQUksSUFBSSxLQUFLLFFBQVEsQ0FBQztBQUFBLElBQ25ELENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFBLE9BQWVNLEdBQW9CLFFBQTJCO0FBQzVELFVBQU0sWUFBWSxJQUFJLGFBQWE7QUFBQTtBQUFBLE1BRWpDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUtMO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQTtBQUFBLE1BR0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUtBO0FBQUEsTUFDTDtBQUFBO0FBQUEsTUFHQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUtBO0FBQUEsSUFDUCxDQUFDO0FBRUQsVUFBTSxRQUFRLElBQUksYUFBYTtBQUFBO0FBQUEsTUFFN0I7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBO0FBQUEsTUFHZjtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUE7QUFBQSxNQUdmO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBRztBQUFBLE1BQUc7QUFBQSxJQUNqQixDQUFDO0FBRUQsVUFBTSxZQUFZLFVBQVUsZ0JBQWdCLFFBQVE7QUFBQSxNQUNsRCxvQkFBb0IsQ0FBQyxnQkFBZ0IsU0FBUyxLQUFLLGdCQUFnQixPQUFPLEdBQUc7QUFBQSxNQUM3RSxZQUFZLENBQUMsV0FBVyxLQUFLO0FBQUEsTUFDN0IsZUFBZSxjQUFjO0FBQUEsSUFDL0IsQ0FBQztBQUVELFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQWlCO0FBQ2YsUUFBSSxHQUFHLE1BQU0sS0FBS0QsRUFBVyxHQUFHO0FBQzlCLFdBQUtBLEdBQVksU0FBUztBQUFBLElBQzVCO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8sa0JBQWtCLFNBQXVCO0FBQzlDLGtCQUFhSyxLQUFTO0FBQUEsRUFDeEI7QUFDRjtBQXRLYSxjQUVJSixLQUFXO0FBRnJCLElBQU0sZUFBTjsiLAogICJuYW1lcyI6IFsiX190b3BFbnRpdHkiLCAiX19sZW5ndGgiLCAiX190b1NraXBTZXR1cCIsICJfX2VuZ2luZSIsICJfX3RhcmdldCIsICJfX21lc2giLCAiX19nZW5lcmF0ZVByaW1pdGl2ZSJdCn0K
