// src/foundation/physics/VRMSpring/SphereCollider.ts
import { _getGizmoClass } from "../../gizmos/GizmoRegistry.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { Vector3 } from "../../math/Vector3.js";
import { Is } from "../../misc/Is.js";
var _SphereCollider = class _SphereCollider {
  constructor(engine, position, radius, baseSceneGraph) {
    /** The local position of the sphere collider relative to its base scene graph node */
    this.Pt = Vector3.zero();
    /** The radius of the sphere collider */
    this._t = 0;
    this.Mw = MutableVector3.zero();
    this.c = engine;
    this.Pt = position;
    this._t = radius;
    this.Jw = baseSceneGraph;
  }
  /**
   * Updates the cached world position of the collider.
   * Should be called once per frame before collision checks.
   */
  updateWorldState() {
    const baseMatrix = this.Jw.matrixInner;
    baseMatrix.multiplyVector3To(this.Pt, this.Mw);
    if (Is.exist(this.Gw) && this.Gw.isVisible) {
      this.Gw._update();
    }
  }
  /**
   * Calculates collision information between this sphere collider and a bone.
   *
   * @param bonePosition - The world position of the bone
   * @param boneRadius - The radius of the bone for collision detection
   * @returns An object containing the collision direction and penetration distance
   *   - direction: The normalized vector pointing from the sphere center to the bone
   *   - distance: The penetration distance (negative if penetrating, positive if separated)
   */
  collision(bonePosition, boneRadius) {
    const delta = Vector3.subtractTo(bonePosition, this.Mw, _SphereCollider.Kg);
    const length = delta.length();
    const radius = this._t + boneRadius;
    const distance = length - radius;
    return { distance, delta, length };
  }
  /**
   * Gets the local position of the collider.
   * @returns The local position vector
   */
  get position() {
    return this.Pt;
  }
  /**
   * Gets the world position of the collider.
   * @returns The world position vector
   */
  get worldPosition() {
    return this.Mw;
  }
  /**
   * Gets the radius of the collider.
   * @returns The radius value
   */
  get radius() {
    return this._t;
  }
  /**
   * Gets the base scene graph component.
   * @returns The base scene graph component
   */
  get baseSceneGraph() {
    return this.Jw;
  }
  /**
   * Gets the gizmo used to visualize this collider.
   * @returns The gizmo instance, or undefined if not set
   */
  get gizmo() {
    return this.Gw;
  }
  /**
   * Sets the gizmo used to visualize this collider.
   * @param gizmo - The gizmo instance to set
   */
  set gizmo(gizmo) {
    this.Gw = gizmo;
  }
  /**
   * Sets the visibility of the collider's gizmo.
   * If the gizmo exists, it will be shown or hidden accordingly.
   * @param visible - Whether the gizmo should be visible
   */
  setGizmoVisible(visible) {
    if (this.Gw == null) {
      this.Gw = new (_getGizmoClass("sphereCollider"))(this.c, this);
      this.Gw._setup();
    }
    this.Gw.isVisible = visible;
  }
  /**
   * Gets whether the gizmo is currently visible.
   * @returns True if the gizmo exists and is visible
   */
  get isGizmoVisible() {
    var _a, _b;
    return (_b = (_a = this.Gw) == null ? void 0 : _a.isVisible) != null ? _b : false;
  }
  /**
   * Destroys the gizmo if it exists.
   */
  destroyGizmo() {
    if (this.Gw != null) {
      this.Gw._destroy();
      this.Gw = void 0;
    }
  }
};
_SphereCollider.Kg = MutableVector3.zero();
var SphereCollider = _SphereCollider;
export {
  SphereCollider
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcGh5c2ljcy9WUk1TcHJpbmcvU3BoZXJlQ29sbGlkZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgU2NlbmVHcmFwaENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvU2NlbmVHcmFwaC9TY2VuZUdyYXBoQ29tcG9uZW50JztcbmltcG9ydCB7IF9nZXRHaXptb0NsYXNzIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL0dpem1vUmVnaXN0cnknO1xuaW1wb3J0IHR5cGUgeyBTcGhlcmVDb2xsaWRlckdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1NwaGVyZUNvbGxpZGVyR2l6bW8nO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi8uLi9taXNjL0lzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtJztcblxuLyoqXG4gKiBBIHNwaGVyZSBjb2xsaWRlciB1c2VkIGZvciBWUk0gc3ByaW5nIGJvbmUgcGh5c2ljcyBzaW11bGF0aW9uLlxuICogVGhpcyBjb2xsaWRlciByZXByZXNlbnRzIGEgc3BoZXJpY2FsIGNvbGxpc2lvbiB2b2x1bWUgdGhhdCBjYW4gaW50ZXJhY3Qgd2l0aCBib25lc1xuICogdG8gcHJldmVudCB0aGVtIGZyb20gcGVuZXRyYXRpbmcgdGhyb3VnaCBzb2xpZCBvYmplY3RzLlxuICovXG5leHBvcnQgY2xhc3MgU3BoZXJlQ29sbGlkZXIge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIC8qKiBUaGUgbG9jYWwgcG9zaXRpb24gb2YgdGhlIHNwaGVyZSBjb2xsaWRlciByZWxhdGl2ZSB0byBpdHMgYmFzZSBzY2VuZSBncmFwaCBub2RlICovXG4gIHByaXZhdGUgX19wb3NpdGlvbiA9IFZlY3RvcjMuemVybygpO1xuXG4gIC8qKiBUaGUgcmFkaXVzIG9mIHRoZSBzcGhlcmUgY29sbGlkZXIgKi9cbiAgcHJpdmF0ZSBfX3JhZGl1cyA9IDA7XG5cbiAgLyoqIFRoZSBiYXNlIHNjZW5lIGdyYXBoIGNvbXBvbmVudCB0aGF0IGRlZmluZXMgdGhlIHRyYW5zZm9ybSBzcGFjZSBmb3IgdGhpcyBjb2xsaWRlciAqL1xuICBwcml2YXRlIF9fYmFzZVNjZW5lR3JhcGg6IFNjZW5lR3JhcGhDb21wb25lbnQ7XG5cbiAgcHJpdmF0ZSBfX3dvcmxkUG9zaXRpb24gPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgLyoqIFRoZSBnaXptbyB1c2VkIHRvIHZpc3VhbGl6ZSB0aGlzIGNvbGxpZGVyICovXG4gIHByaXZhdGUgX19naXptbz86IFNwaGVyZUNvbGxpZGVyR2l6bW87XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBfdmVjM18xID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lLCBwb3NpdGlvbjogVmVjdG9yMywgcmFkaXVzOiBudW1iZXIsIGJhc2VTY2VuZUdyYXBoOiBTY2VuZUdyYXBoQ29tcG9uZW50KSB7XG4gICAgdGhpcy5fX2VuZ2luZSA9IGVuZ2luZTtcbiAgICB0aGlzLl9fcG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICB0aGlzLl9fcmFkaXVzID0gcmFkaXVzO1xuICAgIHRoaXMuX19iYXNlU2NlbmVHcmFwaCA9IGJhc2VTY2VuZUdyYXBoO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNhY2hlZCB3b3JsZCBwb3NpdGlvbiBvZiB0aGUgY29sbGlkZXIuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgb25jZSBwZXIgZnJhbWUgYmVmb3JlIGNvbGxpc2lvbiBjaGVja3MuXG4gICAqL1xuICB1cGRhdGVXb3JsZFN0YXRlKCkge1xuICAgIGNvbnN0IGJhc2VNYXRyaXggPSB0aGlzLl9fYmFzZVNjZW5lR3JhcGgubWF0cml4SW5uZXI7XG4gICAgYmFzZU1hdHJpeC5tdWx0aXBseVZlY3RvcjNUbyh0aGlzLl9fcG9zaXRpb24sIHRoaXMuX193b3JsZFBvc2l0aW9uKTtcbiAgICBpZiAoSXMuZXhpc3QodGhpcy5fX2dpem1vKSAmJiB0aGlzLl9fZ2l6bW8uaXNWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9fZ2l6bW8uX3VwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGNvbGxpc2lvbiBpbmZvcm1hdGlvbiBiZXR3ZWVuIHRoaXMgc3BoZXJlIGNvbGxpZGVyIGFuZCBhIGJvbmUuXG4gICAqXG4gICAqIEBwYXJhbSBib25lUG9zaXRpb24gLSBUaGUgd29ybGQgcG9zaXRpb24gb2YgdGhlIGJvbmVcbiAgICogQHBhcmFtIGJvbmVSYWRpdXMgLSBUaGUgcmFkaXVzIG9mIHRoZSBib25lIGZvciBjb2xsaXNpb24gZGV0ZWN0aW9uXG4gICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjb2xsaXNpb24gZGlyZWN0aW9uIGFuZCBwZW5ldHJhdGlvbiBkaXN0YW5jZVxuICAgKiAgIC0gZGlyZWN0aW9uOiBUaGUgbm9ybWFsaXplZCB2ZWN0b3IgcG9pbnRpbmcgZnJvbSB0aGUgc3BoZXJlIGNlbnRlciB0byB0aGUgYm9uZVxuICAgKiAgIC0gZGlzdGFuY2U6IFRoZSBwZW5ldHJhdGlvbiBkaXN0YW5jZSAobmVnYXRpdmUgaWYgcGVuZXRyYXRpbmcsIHBvc2l0aXZlIGlmIHNlcGFyYXRlZClcbiAgICovXG4gIGNvbGxpc2lvbihib25lUG9zaXRpb246IFZlY3RvcjMsIGJvbmVSYWRpdXM6IG51bWJlcikge1xuICAgIGNvbnN0IGRlbHRhID0gVmVjdG9yMy5zdWJ0cmFjdFRvKGJvbmVQb3NpdGlvbiwgdGhpcy5fX3dvcmxkUG9zaXRpb24sIFNwaGVyZUNvbGxpZGVyLl9fdG1wX3ZlYzNfMSk7XG4gICAgY29uc3QgbGVuZ3RoID0gZGVsdGEubGVuZ3RoKCk7XG4gICAgY29uc3QgcmFkaXVzID0gdGhpcy5fX3JhZGl1cyArIGJvbmVSYWRpdXM7XG4gICAgY29uc3QgZGlzdGFuY2UgPSBsZW5ndGggLSByYWRpdXM7XG5cbiAgICByZXR1cm4geyBkaXN0YW5jZSwgZGVsdGE6IGRlbHRhLCBsZW5ndGggfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsb2NhbCBwb3NpdGlvbiBvZiB0aGUgY29sbGlkZXIuXG4gICAqIEByZXR1cm5zIFRoZSBsb2NhbCBwb3NpdGlvbiB2ZWN0b3JcbiAgICovXG4gIGdldCBwb3NpdGlvbigpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5fX3Bvc2l0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHdvcmxkIHBvc2l0aW9uIG9mIHRoZSBjb2xsaWRlci5cbiAgICogQHJldHVybnMgVGhlIHdvcmxkIHBvc2l0aW9uIHZlY3RvclxuICAgKi9cbiAgZ2V0IHdvcmxkUG9zaXRpb24oKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHRoaXMuX193b3JsZFBvc2l0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHJhZGl1cyBvZiB0aGUgY29sbGlkZXIuXG4gICAqIEByZXR1cm5zIFRoZSByYWRpdXMgdmFsdWVcbiAgICovXG4gIGdldCByYWRpdXMoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3JhZGl1cztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiYXNlIHNjZW5lIGdyYXBoIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGJhc2Ugc2NlbmUgZ3JhcGggY29tcG9uZW50XG4gICAqL1xuICBnZXQgYmFzZVNjZW5lR3JhcGgoKTogU2NlbmVHcmFwaENvbXBvbmVudCB7XG4gICAgcmV0dXJuIHRoaXMuX19iYXNlU2NlbmVHcmFwaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBnaXptbyB1c2VkIHRvIHZpc3VhbGl6ZSB0aGlzIGNvbGxpZGVyLlxuICAgKiBAcmV0dXJucyBUaGUgZ2l6bW8gaW5zdGFuY2UsIG9yIHVuZGVmaW5lZCBpZiBub3Qgc2V0XG4gICAqL1xuICBnZXQgZ2l6bW8oKTogU3BoZXJlQ29sbGlkZXJHaXptbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19naXptbztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXptbyB1c2VkIHRvIHZpc3VhbGl6ZSB0aGlzIGNvbGxpZGVyLlxuICAgKiBAcGFyYW0gZ2l6bW8gLSBUaGUgZ2l6bW8gaW5zdGFuY2UgdG8gc2V0XG4gICAqL1xuICBzZXQgZ2l6bW8oZ2l6bW86IFNwaGVyZUNvbGxpZGVyR2l6bW8gfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fZ2l6bW8gPSBnaXptbztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBjb2xsaWRlcidzIGdpem1vLlxuICAgKiBJZiB0aGUgZ2l6bW8gZXhpc3RzLCBpdCB3aWxsIGJlIHNob3duIG9yIGhpZGRlbiBhY2NvcmRpbmdseS5cbiAgICogQHBhcmFtIHZpc2libGUgLSBXaGV0aGVyIHRoZSBnaXptbyBzaG91bGQgYmUgdmlzaWJsZVxuICAgKi9cbiAgc2V0R2l6bW9WaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2dpem1vID09IG51bGwpIHtcbiAgICAgIHRoaXMuX19naXptbyA9IG5ldyAoX2dldEdpem1vQ2xhc3MoJ3NwaGVyZUNvbGxpZGVyJykpKHRoaXMuX19lbmdpbmUsIHRoaXMpO1xuICAgICAgdGhpcy5fX2dpem1vLl9zZXR1cCgpO1xuICAgIH1cbiAgICB0aGlzLl9fZ2l6bW8uaXNWaXNpYmxlID0gdmlzaWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHdoZXRoZXIgdGhlIGdpem1vIGlzIGN1cnJlbnRseSB2aXNpYmxlLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBnaXptbyBleGlzdHMgYW5kIGlzIHZpc2libGVcbiAgICovXG4gIGdldCBpc0dpem1vVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX2dpem1vPy5pc1Zpc2libGUgPz8gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGdpem1vIGlmIGl0IGV4aXN0cy5cbiAgICovXG4gIGRlc3Ryb3lHaXptbygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fX2dpem1vICE9IG51bGwpIHtcbiAgICAgIHRoaXMuX19naXptby5fZGVzdHJveSgpO1xuICAgICAgdGhpcy5fX2dpem1vID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsc0JBQXNCO0FBRS9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUN4QixTQUFTLFVBQVU7QUFRWixJQUFNLGtCQUFOLE1BQU0sZ0JBQWU7QUFBQSxFQWtCMUIsWUFBWSxRQUFnQixVQUFtQixRQUFnQixnQkFBcUM7QUFmcEc7QUFBQSxTQUFRQSxLQUFhLFFBQVEsS0FBSztBQUdsQztBQUFBLFNBQVFDLEtBQVc7QUFLbkIsU0FBUUMsS0FBa0IsZUFBZSxLQUFLO0FBUTVDLFNBQUtDLElBQVc7QUFDaEIsU0FBS0gsS0FBYTtBQUNsQixTQUFLQyxLQUFXO0FBQ2hCLFNBQUtHLEtBQW1CO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsbUJBQW1CO0FBQ2pCLFVBQU0sYUFBYSxLQUFLQSxHQUFpQjtBQUN6QyxlQUFXLGtCQUFrQixLQUFLSixJQUFZLEtBQUtFLEVBQWU7QUFDbEUsUUFBSSxHQUFHLE1BQU0sS0FBS0csRUFBTyxLQUFLLEtBQUtBLEdBQVEsV0FBVztBQUNwRCxXQUFLQSxHQUFRLFFBQVE7QUFBQSxJQUN2QjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLFVBQVUsY0FBdUIsWUFBb0I7QUFDbkQsVUFBTSxRQUFRLFFBQVEsV0FBVyxjQUFjLEtBQUtILElBQWlCLGdCQUFlSSxFQUFZO0FBQ2hHLFVBQU0sU0FBUyxNQUFNLE9BQU87QUFDNUIsVUFBTSxTQUFTLEtBQUtMLEtBQVc7QUFDL0IsVUFBTSxXQUFXLFNBQVM7QUFFMUIsV0FBTyxFQUFFLFVBQVUsT0FBYyxPQUFPO0FBQUEsRUFDMUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxXQUFvQjtBQUN0QixXQUFPLEtBQUtEO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGdCQUF5QjtBQUMzQixXQUFPLEtBQUtFO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLFNBQWlCO0FBQ25CLFdBQU8sS0FBS0Q7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksaUJBQXNDO0FBQ3hDLFdBQU8sS0FBS0c7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksUUFBeUM7QUFDM0MsV0FBTyxLQUFLQztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxNQUFNLE9BQXdDO0FBQ2hELFNBQUtBLEtBQVU7QUFBQSxFQUNqQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGdCQUFnQixTQUF3QjtBQUN0QyxRQUFJLEtBQUtBLE1BQVcsTUFBTTtBQUN4QixXQUFLQSxLQUFVLEtBQUssZUFBZSxnQkFBZ0IsR0FBRyxLQUFLRixHQUFVLElBQUk7QUFDekUsV0FBS0UsR0FBUSxPQUFPO0FBQUEsSUFDdEI7QUFDQSxTQUFLQSxHQUFRLFlBQVk7QUFBQSxFQUMzQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGlCQUEwQjtBQXJJaEM7QUFzSUksWUFBTyxnQkFBS0EsT0FBTCxtQkFBYyxjQUFkLFlBQTJCO0FBQUEsRUFDcEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGVBQXFCO0FBQ25CLFFBQUksS0FBS0EsTUFBVyxNQUFNO0FBQ3hCLFdBQUtBLEdBQVEsU0FBUztBQUN0QixXQUFLQSxLQUFVO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBQ0Y7QUFySWEsZ0JBZ0JJQyxLQUFlLGVBQWUsS0FBSztBQWhCN0MsSUFBTSxpQkFBTjsiLAogICJuYW1lcyI6IFsiX19wb3NpdGlvbiIsICJfX3JhZGl1cyIsICJfX3dvcmxkUG9zaXRpb24iLCAiX19lbmdpbmUiLCAiX19iYXNlU2NlbmVHcmFwaCIsICJfX2dpem1vIiwgIl9fdG1wX3ZlYzNfMSJdCn0K
