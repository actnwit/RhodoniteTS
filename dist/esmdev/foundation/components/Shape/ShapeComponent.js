// src/foundation/components/Shape/ShapeComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import {
  normalizeShapeDescriptor
} from "../../geometry/Shape.js";
import { _getGizmoClass } from "../../gizmos/GizmoRegistry.js";
import { Quaternion, Vector3 } from "../../math/index.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var ShapeComponent = class extends Component {
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.__shapes = /* @__PURE__ */ new Map();
    this.__nextShapeIndex = 0;
    this.moveStageTo(ProcessStage.Logic);
  }
  static get componentTID() {
    return WellKnownComponentTIDs.ShapeComponentTID;
  }
  get componentTID() {
    return WellKnownComponentTIDs.ShapeComponentTID;
  }
  addShape(descriptor, localTransform = {}) {
    var _a;
    const instance = this.__createShapeInstance(descriptor, localTransform);
    const index = this.__nextShapeIndex++;
    this.__shapes.set(index, instance);
    (_a = this.__shapeGizmo) == null ? void 0 : _a.rebuild();
    return index;
  }
  /**
   * Replaces the shape stored at an existing index while preserving the index.
   *
   * Physics bindings reference shapes by index, so callers can update a
   * collider in place and then call {@link PhysicsComponent.rebuildShapeBindings}.
   *
   * @param index - Stable shape index returned by {@link addShape}
   * @param descriptor - New shape descriptor
   * @param localTransform - New local position and rotation
   * @returns True when the index existed and the shape was replaced
   */
  updateShape(index, descriptor, localTransform = {}) {
    var _a;
    if (!this.__shapes.has(index)) {
      return false;
    }
    this.__shapes.set(index, this.__createShapeInstance(descriptor, localTransform));
    (_a = this.__shapeGizmo) == null ? void 0 : _a.rebuild();
    return true;
  }
  __createShapeInstance(descriptor, localTransform) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    const shape = normalizeShapeDescriptor(descriptor);
    const positionX = (_b = (_a = localTransform.position) == null ? void 0 : _a.x) != null ? _b : 0;
    const positionY = (_d = (_c = localTransform.position) == null ? void 0 : _c.y) != null ? _d : 0;
    const positionZ = (_f = (_e = localTransform.position) == null ? void 0 : _e.z) != null ? _f : 0;
    if (![positionX, positionY, positionZ].every(Number.isFinite)) {
      throw new Error("Shape local position components must be finite.");
    }
    const localPosition = Vector3.fromCopy3(positionX, positionY, positionZ);
    if (![localPosition.x, localPosition.y, localPosition.z].every(Number.isFinite)) {
      throw new Error("Shape local position components must be representable as finite numbers.");
    }
    const rotationX = (_h = (_g = localTransform.rotation) == null ? void 0 : _g.x) != null ? _h : 0;
    const rotationY = (_j = (_i = localTransform.rotation) == null ? void 0 : _i.y) != null ? _j : 0;
    const rotationZ = (_l = (_k = localTransform.rotation) == null ? void 0 : _k.z) != null ? _l : 0;
    const rotationW = (_n = (_m = localTransform.rotation) == null ? void 0 : _m.w) != null ? _n : 1;
    if (![rotationX, rotationY, rotationZ, rotationW].every(Number.isFinite)) {
      throw new Error("Shape local rotation components must be finite.");
    }
    const rotationLength = Math.hypot(rotationX, rotationY, rotationZ, rotationW);
    if (!Number.isFinite(rotationLength) || rotationLength === 0) {
      throw new Error("Shape local rotation must be a non-zero quaternion.");
    }
    const inverseRotationLength = 1 / rotationLength;
    return Object.freeze({
      shape,
      localPosition,
      localRotation: Quaternion.fromCopy4(
        rotationX * inverseRotationLength,
        rotationY * inverseRotationLength,
        rotationZ * inverseRotationLength,
        rotationW * inverseRotationLength
      )
    });
  }
  /** Adds a box fitted to a local-space AABB and returns its new shape index. */
  addBoxFromAabb(aabb, options = {}) {
    var _a;
    if (aabb.isVanilla()) {
      throw new Error("Cannot create a box from an uninitialized AABB.");
    }
    const origin = (_a = options.origin) != null ? _a : Vector3.zero();
    const values = [aabb.sizeX, aabb.sizeY, aabb.sizeZ, origin.x, origin.y, origin.z];
    if (values.some((value) => !Number.isFinite(value)) || aabb.sizeX <= 0 || aabb.sizeY <= 0 || aabb.sizeZ <= 0) {
      throw new Error("Box AABB and origin must contain finite values and positive dimensions.");
    }
    return this.addShape(
      { type: "box", size: Vector3.fromCopy3(aabb.sizeX, aabb.sizeY, aabb.sizeZ) },
      { position: Vector3.subtract(aabb.centerPoint, origin) }
    );
  }
  /** Fits a foot-to-head capsule to an AABB and returns its new shape index. */
  addCapsuleFromAabb(aabb, options = {}) {
    var _a, _b, _c;
    if (aabb.isVanilla()) {
      throw new Error("Cannot create a capsule from an uninitialized AABB.");
    }
    const origin = (_a = options.origin) != null ? _a : Vector3.zero();
    const radiusScale = (_b = options.radiusScale) != null ? _b : 1;
    const maxRadiusToHeightRatio = (_c = options.maxRadiusToHeightRatio) != null ? _c : 0.2;
    const values = [
      aabb.sizeX,
      aabb.sizeY,
      aabb.sizeZ,
      origin.x,
      origin.y,
      origin.z,
      radiusScale,
      maxRadiusToHeightRatio
    ];
    if (values.some((value) => !Number.isFinite(value)) || aabb.sizeX <= 0 || aabb.sizeY <= 0 || aabb.sizeZ <= 0) {
      throw new Error("Capsule AABB and origin must contain finite values and positive dimensions.");
    }
    if (radiusScale <= 0 || maxRadiusToHeightRatio <= 0 || maxRadiusToHeightRatio >= 0.5) {
      throw new Error("Capsule radiusScale must be positive and maxRadiusToHeightRatio must be between 0 and 0.5.");
    }
    const radius = Math.min(Math.max(aabb.sizeX, aabb.sizeZ) / 2 * radiusScale, aabb.sizeY * maxRadiusToHeightRatio);
    const height = aabb.sizeY - radius * 2;
    return this.addShape(
      { type: "capsule", height, radiusBottom: radius, radiusTop: radius },
      { position: Vector3.subtract(aabb.centerPoint, origin) }
    );
  }
  getShape(index = 0) {
    return this.__shapes.get(index);
  }
  removeShape(index) {
    var _a;
    if (!Number.isInteger(index) || index < 0 || !this.__shapes.delete(index)) {
      return false;
    }
    (_a = this.__shapeGizmo) == null ? void 0 : _a.rebuild();
    return true;
  }
  clearShapes() {
    var _a;
    this.__shapes.clear();
    (_a = this.__shapeGizmo) == null ? void 0 : _a.rebuild();
  }
  get shapeCount() {
    return this.__shapes.size;
  }
  /** @internal Iterates stable shape indices and their instances. */
  _getShapeEntries() {
    return this.__shapes.entries();
  }
  $logic() {
    var _a;
    if ((_a = this.__shapeGizmo) == null ? void 0 : _a.isVisible) {
      this.__shapeGizmo._update();
    }
  }
  set isShapeGizmoVisible(visible) {
    if (visible && this.__shapeGizmo == null) {
      this.__shapeGizmo = new (_getGizmoClass("shape"))(this.__engine, this);
      this.__shapeGizmo._setup();
    }
    if (this.__shapeGizmo != null) {
      this.__shapeGizmo.isVisible = visible;
    }
  }
  get isShapeGizmoVisible() {
    var _a, _b;
    return (_b = (_a = this.__shapeGizmo) == null ? void 0 : _a.isVisible) != null ? _b : false;
  }
  get shapeGizmo() {
    return this.__shapeGizmo;
  }
  /** @internal Copies immutable ShapeInstances while preserving their stable indices. */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.__shapes = new Map(component.__shapes);
    this.__nextShapeIndex = component.__nextShapeIndex;
  }
  _destroy() {
    var _a;
    (_a = this.__shapeGizmo) == null ? void 0 : _a._destroy();
    this.__shapeGizmo = void 0;
    this.clearShapes();
    this.__nextShapeIndex = 0;
    super._destroy();
  }
  addThisComponentToEntity(base, _componentClass) {
    class ShapeEntity extends base.constructor {
      getShape() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.ShapeComponentTID);
      }
    }
    applyMixins(base, ShapeEntity);
    return base;
  }
};
export {
  ShapeComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9TaGFwZS9TaGFwZUNvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlEIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMsIHR5cGUgRW50aXR5UmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5UmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Qcm9jZXNzU3RhZ2UnO1xuaW1wb3J0IHtcbiAgbm9ybWFsaXplU2hhcGVEZXNjcmlwdG9yLFxuICB0eXBlIFNoYXBlRGVzY3JpcHRvcixcbiAgdHlwZSBTaGFwZUluc3RhbmNlLFxuICB0eXBlIFNoYXBlTG9jYWxUcmFuc2Zvcm0sXG59IGZyb20gJy4uLy4uL2dlb21ldHJ5L1NoYXBlJztcbmltcG9ydCB7IF9nZXRHaXptb0NsYXNzIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL0dpem1vUmVnaXN0cnknO1xuaW1wb3J0IHR5cGUgeyBTaGFwZUdpem1vIH0gZnJvbSAnLi4vLi4vZ2l6bW9zL1NoYXBlR2l6bW8nO1xuaW1wb3J0IHsgUXVhdGVybmlvbiwgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgnO1xuaW1wb3J0IHR5cGUgeyBBQUJCIH0gZnJvbSAnLi4vLi4vbWF0aC9BQUJCJztcbmltcG9ydCB0eXBlIHsgSVZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL0lWZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzIH0gZnJvbSAnLi4vQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuXG4vKiogU3RvcmVzIGxpZ2h0d2VpZ2h0IGFuYWx5dGljIHNoYXBlcyBpbmRlcGVuZGVudGx5IGZyb20gdGhlaXIgY29uc3VtZXJzLiAqL1xuZXhwb3J0IGNsYXNzIFNoYXBlQ29tcG9uZW50IGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBfX3NoYXBlcyA9IG5ldyBNYXA8bnVtYmVyLCBTaGFwZUluc3RhbmNlPigpO1xuICBwcml2YXRlIF9fbmV4dFNoYXBlSW5kZXggPSAwO1xuICBwcml2YXRlIF9fc2hhcGVHaXptbz86IFNoYXBlR2l6bW87XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeSxcbiAgICBpc1JlVXNlOiBib29sZWFuXG4gICkge1xuICAgIHN1cGVyKGVuZ2luZSwgZW50aXR5VWlkLCBjb21wb25lbnRTaWQsIGVudGl0eVJlcG9zaXRvcnksIGlzUmVVc2UpO1xuICAgIHRoaXMubW92ZVN0YWdlVG8oUHJvY2Vzc1N0YWdlLkxvZ2ljKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlNoYXBlQ29tcG9uZW50VElEO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFRJRCgpOiBDb21wb25lbnRUSUQge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlNoYXBlQ29tcG9uZW50VElEO1xuICB9XG5cbiAgYWRkU2hhcGUoZGVzY3JpcHRvcjogU2hhcGVEZXNjcmlwdG9yLCBsb2NhbFRyYW5zZm9ybTogU2hhcGVMb2NhbFRyYW5zZm9ybSA9IHt9KTogbnVtYmVyIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuX19jcmVhdGVTaGFwZUluc3RhbmNlKGRlc2NyaXB0b3IsIGxvY2FsVHJhbnNmb3JtKTtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX19uZXh0U2hhcGVJbmRleCsrO1xuICAgIHRoaXMuX19zaGFwZXMuc2V0KGluZGV4LCBpbnN0YW5jZSk7XG4gICAgdGhpcy5fX3NoYXBlR2l6bW8/LnJlYnVpbGQoKTtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgdGhlIHNoYXBlIHN0b3JlZCBhdCBhbiBleGlzdGluZyBpbmRleCB3aGlsZSBwcmVzZXJ2aW5nIHRoZSBpbmRleC5cbiAgICpcbiAgICogUGh5c2ljcyBiaW5kaW5ncyByZWZlcmVuY2Ugc2hhcGVzIGJ5IGluZGV4LCBzbyBjYWxsZXJzIGNhbiB1cGRhdGUgYVxuICAgKiBjb2xsaWRlciBpbiBwbGFjZSBhbmQgdGhlbiBjYWxsIHtAbGluayBQaHlzaWNzQ29tcG9uZW50LnJlYnVpbGRTaGFwZUJpbmRpbmdzfS5cbiAgICpcbiAgICogQHBhcmFtIGluZGV4IC0gU3RhYmxlIHNoYXBlIGluZGV4IHJldHVybmVkIGJ5IHtAbGluayBhZGRTaGFwZX1cbiAgICogQHBhcmFtIGRlc2NyaXB0b3IgLSBOZXcgc2hhcGUgZGVzY3JpcHRvclxuICAgKiBAcGFyYW0gbG9jYWxUcmFuc2Zvcm0gLSBOZXcgbG9jYWwgcG9zaXRpb24gYW5kIHJvdGF0aW9uXG4gICAqIEByZXR1cm5zIFRydWUgd2hlbiB0aGUgaW5kZXggZXhpc3RlZCBhbmQgdGhlIHNoYXBlIHdhcyByZXBsYWNlZFxuICAgKi9cbiAgdXBkYXRlU2hhcGUoaW5kZXg6IG51bWJlciwgZGVzY3JpcHRvcjogU2hhcGVEZXNjcmlwdG9yLCBsb2NhbFRyYW5zZm9ybTogU2hhcGVMb2NhbFRyYW5zZm9ybSA9IHt9KTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLl9fc2hhcGVzLmhhcyhpbmRleCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fX3NoYXBlcy5zZXQoaW5kZXgsIHRoaXMuX19jcmVhdGVTaGFwZUluc3RhbmNlKGRlc2NyaXB0b3IsIGxvY2FsVHJhbnNmb3JtKSk7XG4gICAgdGhpcy5fX3NoYXBlR2l6bW8/LnJlYnVpbGQoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX19jcmVhdGVTaGFwZUluc3RhbmNlKGRlc2NyaXB0b3I6IFNoYXBlRGVzY3JpcHRvciwgbG9jYWxUcmFuc2Zvcm06IFNoYXBlTG9jYWxUcmFuc2Zvcm0pOiBTaGFwZUluc3RhbmNlIHtcbiAgICBjb25zdCBzaGFwZSA9IG5vcm1hbGl6ZVNoYXBlRGVzY3JpcHRvcihkZXNjcmlwdG9yKTtcbiAgICBjb25zdCBwb3NpdGlvblggPSBsb2NhbFRyYW5zZm9ybS5wb3NpdGlvbj8ueCA/PyAwO1xuICAgIGNvbnN0IHBvc2l0aW9uWSA9IGxvY2FsVHJhbnNmb3JtLnBvc2l0aW9uPy55ID8/IDA7XG4gICAgY29uc3QgcG9zaXRpb25aID0gbG9jYWxUcmFuc2Zvcm0ucG9zaXRpb24/LnogPz8gMDtcbiAgICBpZiAoIVtwb3NpdGlvblgsIHBvc2l0aW9uWSwgcG9zaXRpb25aXS5ldmVyeShOdW1iZXIuaXNGaW5pdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYXBlIGxvY2FsIHBvc2l0aW9uIGNvbXBvbmVudHMgbXVzdCBiZSBmaW5pdGUuJyk7XG4gICAgfVxuICAgIGNvbnN0IGxvY2FsUG9zaXRpb24gPSBWZWN0b3IzLmZyb21Db3B5Myhwb3NpdGlvblgsIHBvc2l0aW9uWSwgcG9zaXRpb25aKTtcbiAgICBpZiAoIVtsb2NhbFBvc2l0aW9uLngsIGxvY2FsUG9zaXRpb24ueSwgbG9jYWxQb3NpdGlvbi56XS5ldmVyeShOdW1iZXIuaXNGaW5pdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYXBlIGxvY2FsIHBvc2l0aW9uIGNvbXBvbmVudHMgbXVzdCBiZSByZXByZXNlbnRhYmxlIGFzIGZpbml0ZSBudW1iZXJzLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHJvdGF0aW9uWCA9IGxvY2FsVHJhbnNmb3JtLnJvdGF0aW9uPy54ID8/IDA7XG4gICAgY29uc3Qgcm90YXRpb25ZID0gbG9jYWxUcmFuc2Zvcm0ucm90YXRpb24/LnkgPz8gMDtcbiAgICBjb25zdCByb3RhdGlvblogPSBsb2NhbFRyYW5zZm9ybS5yb3RhdGlvbj8ueiA/PyAwO1xuICAgIGNvbnN0IHJvdGF0aW9uVyA9IGxvY2FsVHJhbnNmb3JtLnJvdGF0aW9uPy53ID8/IDE7XG4gICAgaWYgKCFbcm90YXRpb25YLCByb3RhdGlvblksIHJvdGF0aW9uWiwgcm90YXRpb25XXS5ldmVyeShOdW1iZXIuaXNGaW5pdGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NoYXBlIGxvY2FsIHJvdGF0aW9uIGNvbXBvbmVudHMgbXVzdCBiZSBmaW5pdGUuJyk7XG4gICAgfVxuICAgIGNvbnN0IHJvdGF0aW9uTGVuZ3RoID0gTWF0aC5oeXBvdChyb3RhdGlvblgsIHJvdGF0aW9uWSwgcm90YXRpb25aLCByb3RhdGlvblcpO1xuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHJvdGF0aW9uTGVuZ3RoKSB8fCByb3RhdGlvbkxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTaGFwZSBsb2NhbCByb3RhdGlvbiBtdXN0IGJlIGEgbm9uLXplcm8gcXVhdGVybmlvbi4nKTtcbiAgICB9XG4gICAgY29uc3QgaW52ZXJzZVJvdGF0aW9uTGVuZ3RoID0gMSAvIHJvdGF0aW9uTGVuZ3RoO1xuICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgIHNoYXBlLFxuICAgICAgbG9jYWxQb3NpdGlvbixcbiAgICAgIGxvY2FsUm90YXRpb246IFF1YXRlcm5pb24uZnJvbUNvcHk0KFxuICAgICAgICByb3RhdGlvblggKiBpbnZlcnNlUm90YXRpb25MZW5ndGgsXG4gICAgICAgIHJvdGF0aW9uWSAqIGludmVyc2VSb3RhdGlvbkxlbmd0aCxcbiAgICAgICAgcm90YXRpb25aICogaW52ZXJzZVJvdGF0aW9uTGVuZ3RoLFxuICAgICAgICByb3RhdGlvblcgKiBpbnZlcnNlUm90YXRpb25MZW5ndGhcbiAgICAgICksXG4gICAgfSk7XG4gIH1cblxuICAvKiogQWRkcyBhIGJveCBmaXR0ZWQgdG8gYSBsb2NhbC1zcGFjZSBBQUJCIGFuZCByZXR1cm5zIGl0cyBuZXcgc2hhcGUgaW5kZXguICovXG4gIGFkZEJveEZyb21BYWJiKGFhYmI6IEFBQkIsIG9wdGlvbnM6IEJveEZyb21BYWJiT3B0aW9ucyA9IHt9KTogbnVtYmVyIHtcbiAgICBpZiAoYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgY3JlYXRlIGEgYm94IGZyb20gYW4gdW5pbml0aWFsaXplZCBBQUJCLicpO1xuICAgIH1cbiAgICBjb25zdCBvcmlnaW4gPSBvcHRpb25zLm9yaWdpbiA/PyBWZWN0b3IzLnplcm8oKTtcbiAgICBjb25zdCB2YWx1ZXMgPSBbYWFiYi5zaXplWCwgYWFiYi5zaXplWSwgYWFiYi5zaXplWiwgb3JpZ2luLngsIG9yaWdpbi55LCBvcmlnaW4uel07XG4gICAgaWYgKHZhbHVlcy5zb21lKHZhbHVlID0+ICFOdW1iZXIuaXNGaW5pdGUodmFsdWUpKSB8fCBhYWJiLnNpemVYIDw9IDAgfHwgYWFiYi5zaXplWSA8PSAwIHx8IGFhYmIuc2l6ZVogPD0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb3ggQUFCQiBhbmQgb3JpZ2luIG11c3QgY29udGFpbiBmaW5pdGUgdmFsdWVzIGFuZCBwb3NpdGl2ZSBkaW1lbnNpb25zLicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5hZGRTaGFwZShcbiAgICAgIHsgdHlwZTogJ2JveCcsIHNpemU6IFZlY3RvcjMuZnJvbUNvcHkzKGFhYmIuc2l6ZVgsIGFhYmIuc2l6ZVksIGFhYmIuc2l6ZVopIH0sXG4gICAgICB7IHBvc2l0aW9uOiBWZWN0b3IzLnN1YnRyYWN0KGFhYmIuY2VudGVyUG9pbnQsIG9yaWdpbikgfVxuICAgICk7XG4gIH1cblxuICAvKiogRml0cyBhIGZvb3QtdG8taGVhZCBjYXBzdWxlIHRvIGFuIEFBQkIgYW5kIHJldHVybnMgaXRzIG5ldyBzaGFwZSBpbmRleC4gKi9cbiAgYWRkQ2Fwc3VsZUZyb21BYWJiKGFhYmI6IEFBQkIsIG9wdGlvbnM6IENhcHN1bGVGcm9tQWFiYk9wdGlvbnMgPSB7fSk6IG51bWJlciB7XG4gICAgaWYgKGFhYmIuaXNWYW5pbGxhKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBhIGNhcHN1bGUgZnJvbSBhbiB1bmluaXRpYWxpemVkIEFBQkIuJyk7XG4gICAgfVxuICAgIGNvbnN0IG9yaWdpbiA9IG9wdGlvbnMub3JpZ2luID8/IFZlY3RvcjMuemVybygpO1xuICAgIGNvbnN0IHJhZGl1c1NjYWxlID0gb3B0aW9ucy5yYWRpdXNTY2FsZSA/PyAxO1xuICAgIGNvbnN0IG1heFJhZGl1c1RvSGVpZ2h0UmF0aW8gPSBvcHRpb25zLm1heFJhZGl1c1RvSGVpZ2h0UmF0aW8gPz8gMC4yO1xuICAgIGNvbnN0IHZhbHVlcyA9IFtcbiAgICAgIGFhYmIuc2l6ZVgsXG4gICAgICBhYWJiLnNpemVZLFxuICAgICAgYWFiYi5zaXplWixcbiAgICAgIG9yaWdpbi54LFxuICAgICAgb3JpZ2luLnksXG4gICAgICBvcmlnaW4ueixcbiAgICAgIHJhZGl1c1NjYWxlLFxuICAgICAgbWF4UmFkaXVzVG9IZWlnaHRSYXRpbyxcbiAgICBdO1xuICAgIGlmICh2YWx1ZXMuc29tZSh2YWx1ZSA9PiAhTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkgfHwgYWFiYi5zaXplWCA8PSAwIHx8IGFhYmIuc2l6ZVkgPD0gMCB8fCBhYWJiLnNpemVaIDw9IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fwc3VsZSBBQUJCIGFuZCBvcmlnaW4gbXVzdCBjb250YWluIGZpbml0ZSB2YWx1ZXMgYW5kIHBvc2l0aXZlIGRpbWVuc2lvbnMuJyk7XG4gICAgfVxuICAgIGlmIChyYWRpdXNTY2FsZSA8PSAwIHx8IG1heFJhZGl1c1RvSGVpZ2h0UmF0aW8gPD0gMCB8fCBtYXhSYWRpdXNUb0hlaWdodFJhdGlvID49IDAuNSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYXBzdWxlIHJhZGl1c1NjYWxlIG11c3QgYmUgcG9zaXRpdmUgYW5kIG1heFJhZGl1c1RvSGVpZ2h0UmF0aW8gbXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDAuNS4nKTtcbiAgICB9XG4gICAgY29uc3QgcmFkaXVzID0gTWF0aC5taW4oKE1hdGgubWF4KGFhYmIuc2l6ZVgsIGFhYmIuc2l6ZVopIC8gMikgKiByYWRpdXNTY2FsZSwgYWFiYi5zaXplWSAqIG1heFJhZGl1c1RvSGVpZ2h0UmF0aW8pO1xuICAgIGNvbnN0IGhlaWdodCA9IGFhYmIuc2l6ZVkgLSByYWRpdXMgKiAyO1xuICAgIHJldHVybiB0aGlzLmFkZFNoYXBlKFxuICAgICAgeyB0eXBlOiAnY2Fwc3VsZScsIGhlaWdodCwgcmFkaXVzQm90dG9tOiByYWRpdXMsIHJhZGl1c1RvcDogcmFkaXVzIH0sXG4gICAgICB7IHBvc2l0aW9uOiBWZWN0b3IzLnN1YnRyYWN0KGFhYmIuY2VudGVyUG9pbnQsIG9yaWdpbikgfVxuICAgICk7XG4gIH1cblxuICBnZXRTaGFwZShpbmRleCA9IDApOiBTaGFwZUluc3RhbmNlIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYXBlcy5nZXQoaW5kZXgpO1xuICB9XG5cbiAgcmVtb3ZlU2hhcGUoaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihpbmRleCkgfHwgaW5kZXggPCAwIHx8ICF0aGlzLl9fc2hhcGVzLmRlbGV0ZShpbmRleCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fX3NoYXBlR2l6bW8/LnJlYnVpbGQoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGNsZWFyU2hhcGVzKCk6IHZvaWQge1xuICAgIHRoaXMuX19zaGFwZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9fc2hhcGVHaXptbz8ucmVidWlsZCgpO1xuICB9XG5cbiAgZ2V0IHNoYXBlQ291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYXBlcy5zaXplO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCBJdGVyYXRlcyBzdGFibGUgc2hhcGUgaW5kaWNlcyBhbmQgdGhlaXIgaW5zdGFuY2VzLiAqL1xuICBfZ2V0U2hhcGVFbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W251bWJlciwgU2hhcGVJbnN0YW5jZV0+IHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYXBlcy5lbnRyaWVzKCk7XG4gIH1cblxuICAkbG9naWMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX19zaGFwZUdpem1vPy5pc1Zpc2libGUpIHtcbiAgICAgIHRoaXMuX19zaGFwZUdpem1vLl91cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBzZXQgaXNTaGFwZUdpem1vVmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKSB7XG4gICAgaWYgKHZpc2libGUgJiYgdGhpcy5fX3NoYXBlR2l6bW8gPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3NoYXBlR2l6bW8gPSBuZXcgKF9nZXRHaXptb0NsYXNzKCdzaGFwZScpKSh0aGlzLl9fZW5naW5lLCB0aGlzKTtcbiAgICAgIHRoaXMuX19zaGFwZUdpem1vLl9zZXR1cCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX3NoYXBlR2l6bW8gIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX3NoYXBlR2l6bW8uaXNWaXNpYmxlID0gdmlzaWJsZTtcbiAgICB9XG4gIH1cblxuICBnZXQgaXNTaGFwZUdpem1vVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fX3NoYXBlR2l6bW8/LmlzVmlzaWJsZSA/PyBmYWxzZTtcbiAgfVxuXG4gIGdldCBzaGFwZUdpem1vKCk6IFNoYXBlR2l6bW8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fc2hhcGVHaXptbztcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgQ29waWVzIGltbXV0YWJsZSBTaGFwZUluc3RhbmNlcyB3aGlsZSBwcmVzZXJ2aW5nIHRoZWlyIHN0YWJsZSBpbmRpY2VzLiAqL1xuICBfc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudF86IENvbXBvbmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IGNvbXBvbmVudF8gYXMgU2hhcGVDb21wb25lbnQ7XG4gICAgdGhpcy5fX3NoYXBlcyA9IG5ldyBNYXAoY29tcG9uZW50Ll9fc2hhcGVzKTtcbiAgICB0aGlzLl9fbmV4dFNoYXBlSW5kZXggPSBjb21wb25lbnQuX19uZXh0U2hhcGVJbmRleDtcbiAgfVxuXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX19zaGFwZUdpem1vPy5fZGVzdHJveSgpO1xuICAgIHRoaXMuX19zaGFwZUdpem1vID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY2xlYXJTaGFwZXMoKTtcbiAgICB0aGlzLl9fbmV4dFNoYXBlSW5kZXggPSAwO1xuICAgIHN1cGVyLl9kZXN0cm95KCk7XG4gIH1cblxuICBhZGRUaGlzQ29tcG9uZW50VG9FbnRpdHk8RW50aXR5QmFzZSBleHRlbmRzIElFbnRpdHksIFNvbWVDb21wb25lbnRDbGFzcyBleHRlbmRzIHR5cGVvZiBDb21wb25lbnQ+KFxuICAgIGJhc2U6IEVudGl0eUJhc2UsXG4gICAgX2NvbXBvbmVudENsYXNzOiBTb21lQ29tcG9uZW50Q2xhc3NcbiAgKSB7XG4gICAgY2xhc3MgU2hhcGVFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIGdldFNoYXBlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wb25lbnRCeUNvbXBvbmVudFRJRChXZWxsS25vd25Db21wb25lbnRUSURzLlNoYXBlQ29tcG9uZW50VElEKSBhcyBTaGFwZUNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgU2hhcGVFbnRpdHkpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQm94RnJvbUFhYmJPcHRpb25zIHtcbiAgLyoqIE9yaWdpbiBleHByZXNzZWQgaW4gdGhlIHNhbWUgY29vcmRpbmF0ZXMgYXMgdGhlIEFBQkIuICovXG4gIG9yaWdpbj86IElWZWN0b3IzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENhcHN1bGVGcm9tQWFiYk9wdGlvbnMge1xuICAvKiogT3JpZ2luIGV4cHJlc3NlZCBpbiB0aGUgc2FtZSBjb29yZGluYXRlcyBhcyB0aGUgQUFCQi4gKi9cbiAgb3JpZ2luPzogSVZlY3RvcjM7XG4gIHJhZGl1c1NjYWxlPzogbnVtYmVyO1xuICAvKiogTWF4aW11bSByYWRpdXMgYXMgYSBmcmFjdGlvbiBvZiBBQUJCIGhlaWdodC4gTXVzdCBiZSBiZWxvdyAwLjUuICovXG4gIG1heFJhZGl1c1RvSGVpZ2h0UmF0aW8/OiBudW1iZXI7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FBUyxvQkFBb0I7QUFDN0I7QUFBQSxFQUNFO0FBQUEsT0FJSztBQUNQLFNBQVMsc0JBQXNCO0FBRS9CLFNBQVMsWUFBWSxlQUFlO0FBS3BDLFNBQVMsOEJBQThCO0FBR2hDLElBQU0saUJBQU4sY0FBNkIsVUFBVTtBQUFBLEVBSzVDLFlBQ0UsUUFDQSxXQUNBLGNBQ0Esa0JBQ0EsU0FDQTtBQUNBLFVBQU0sUUFBUSxXQUFX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
