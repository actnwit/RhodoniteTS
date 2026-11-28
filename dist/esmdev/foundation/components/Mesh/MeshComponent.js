// src/foundation/components/Mesh/MeshComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { MathClassUtil } from "../../math/MathClassUtil.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { MutableMatrix44 } from "../../math/MutableMatrix44.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { Vector3 } from "../../math/Vector3.js";
import { Vector4 } from "../../math/Vector4.js";
import { Is } from "../../misc/Is.js";
import { Logger } from "../../misc/Logger.js";
import { assertExist } from "../../misc/MiscUtil.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
var _MeshComponent = class _MeshComponent extends Component {
  constructor() {
    super(...arguments);
    this.Sd = -Number.MAX_VALUE;
    this.isPickable = true;
  }
  /**
   * Gets the component type identifier for MeshComponent.
   * @returns The component type ID for mesh components
   */
  static get componentTID() {
    return WellKnownComponentTIDs.MeshComponentTID;
  }
  /**
   * Gets the component type identifier for this instance.
   * @returns The component type ID for mesh components
   */
  get componentTID() {
    return WellKnownComponentTIDs.MeshComponentTID;
  }
  /**
   * Associates a mesh with this component.
   * @param mesh - The mesh to be assigned to this component
   */
  setMesh(mesh) {
    var _a;
    if (this.Rd === mesh) {
      return;
    }
    if (this.Rd) {
      this.Rd._removeMeshComponent(this);
    }
    this.Rd = mesh;
    mesh._belongToMeshComponent(this);
    (_a = this.entity.tryToGetSceneGraph()) == null ? void 0 : _a.setWorldAABBDirtyParentRecursively();
  }
  /**
   * Removes the mesh association from this component.
   * @returns True if a mesh was successfully unset, false if no mesh was set
   */
  unsetMesh() {
    var _a;
    if (this.Rd == null) {
      return false;
    }
    this.Rd._removeMeshComponent(this);
    this.Rd = void 0;
    (_a = this.entity.tryToGetSceneGraph()) == null ? void 0 : _a.setWorldAABBDirtyParentRecursively();
    return true;
  }
  /**
   * Gets the mesh associated with this component.
   * @returns The mesh instance, or undefined if no mesh is set
   */
  get mesh() {
    return this.Rd;
  }
  /**
   * Calculates the view depth of the mesh center from the given camera's perspective.
   * This is used for depth sorting and rendering order determination.
   * @param cameraComponent - The camera component to calculate depth from
   * @returns The depth value in view space (negative Z value), or Number.MAX_VALUE if no mesh is set
   */
  calcViewDepth(cameraComponent) {
    if (Is.not.exist(this.Rd)) {
      return Number.MAX_VALUE;
    }
    const centerPosition_inLocal = this.Rd.AABB.centerPoint;
    const skeletal = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletal) && Is.exist(skeletal._bindShapeMatrix)) {
      skeletal._bindShapeMatrix.multiplyVector3To(this.Rd.AABB.centerPoint, centerPosition_inLocal);
    }
    const worldMatrixInner = this.entity.getSceneGraph().matrixInner;
    const centerPosition_inWorld = worldMatrixInner.multiplyVector3To(
      centerPosition_inLocal,
      _MeshComponent.Hc
    );
    const viewMatrix = cameraComponent.viewMatrix;
    const centerPosition_inView = viewMatrix.multiplyVector3To(centerPosition_inWorld, _MeshComponent.Dc);
    this.Sd = centerPosition_inView.z;
    return this.Sd;
  }
  /**
   * Gets the cached view depth value.
   * @returns The current view depth value
   */
  get viewDepth() {
    return this.Sd;
  }
  /**
   * Logs a debug message when no mesh is set on a MeshComponent.
   * @param meshComponent - The mesh component instance to log about
   */
  static alertNoMeshSet(meshComponent) {
    Logger.default.debug(`No mesh is set on this MeshComponent:${meshComponent.componentSID}`);
  }
  /**
   * Performs ray casting against the mesh geometry in world space.
   * @param srcPointInWorld - The ray origin point in world coordinates
   * @param directionInWorld - The ray direction vector in world coordinates
   * @param dotThreshold - The dot product threshold for face culling (default: 0)
   * @returns Ray casting result with intersection information
   */
  castRay(srcPointInWorld, directionInWorld, dotThreshold = 0) {
    if (this.Rd) {
      let srcPointInLocal = srcPointInWorld;
      let directionInLocal = directionInWorld;
      const sceneGraphComponent = this.entity.tryToGetSceneGraph();
      if (sceneGraphComponent != null) {
        const invWorldMatrix = Matrix44.invert(sceneGraphComponent.matrixInner);
        srcPointInLocal = Vector3.fromCopyVector4(
          invWorldMatrix.multiplyVector(Vector4.fromCopyVector3(srcPointInWorld))
        );
        const distVecInWorld = Vector3.add(srcPointInWorld, directionInWorld);
        const distVecInLocal = Vector3.fromCopyVector4(
          invWorldMatrix.multiplyVector(Vector4.fromCopyVector3(distVecInWorld))
        );
        directionInLocal = Vector3.normalize(Vector3.subtract(distVecInLocal, srcPointInLocal));
        const result = this.Rd.castRay(srcPointInLocal, directionInLocal, dotThreshold);
        let intersectPositionInWorld = null;
        if (Is.defined(result.data) && result.data.t >= 0) {
          intersectPositionInWorld = Vector3.fromCopyVector4(
            sceneGraphComponent.matrixInner.multiplyVector(Vector4.fromCopyVector3(result.data.position))
          );
          return {
            result: true,
            data: {
              t: result.data.t,
              u: result.data.u,
              v: result.data.v,
              position: intersectPositionInWorld
            }
          };
        }
      }
    }
    return {
      result: false
    };
  }
  /**
   * Performs ray casting from screen coordinates against the mesh in local space.
   * @param x - The X coordinate in screen space
   * @param y - The Y coordinate in screen space
   * @param camera - The camera component for projection calculations
   * @param viewport - The viewport dimensions as Vector4 (x, y, width, height)
   * @param dotThreshold - The dot product threshold for face culling (default: 0)
   * @returns Ray casting result with intersection information in local space
   */
  castRayFromScreenInLocal(x, y, camera, viewport, dotThreshold = 0) {
    if (this.Rd) {
      const sceneGraphComponent = this.entity.tryToGetSceneGraph();
      if (sceneGraphComponent != null) {
        const invPVW = MutableMatrix44.multiplyTo(
          camera.projectionMatrix,
          camera.viewMatrix,
          _MeshComponent.zc
        ).multiply(sceneGraphComponent.matrixInner).invert();
        const srcPointInLocal = MathClassUtil.unProjectTo(x, y, 0, invPVW, viewport, _MeshComponent.Hc);
        const distVecInLocal = MathClassUtil.unProjectTo(x, y, 1, invPVW, viewport, _MeshComponent.Dc);
        const directionInLocal = MutableVector3.subtractTo(
          distVecInLocal,
          srcPointInLocal,
          _MeshComponent.Ec
        ).normalize();
        const result = this.Rd.castRay(srcPointInLocal, directionInLocal, dotThreshold);
        if (Is.defined(result.data) && result.data.t >= 0) {
          return {
            result: true,
            data: {
              t: result.data.t,
              u: result.data.u,
              v: result.data.v,
              position: result.data.position
            }
          };
        }
      }
    }
    return {
      result: false
    };
  }
  /**
   * Performs ray casting from screen coordinates against the mesh in world space.
   * @param x - The X coordinate in screen space
   * @param y - The Y coordinate in screen space
   * @param camera - The camera component for projection calculations
   * @param viewport - The viewport dimensions as Vector4 (x, y, width, height)
   * @param dotThreshold - The dot product threshold for face culling (default: 0)
   * @returns Ray casting result with intersection information in world space
   */
  castRayFromScreenInWorld(x, y, camera, viewport, dotThreshold = 0) {
    const result = this.castRayFromScreenInLocal(x, y, camera, viewport, dotThreshold);
    const sceneGraphComponent = this.entity.tryToGetSceneGraph();
    if (this.Rd && sceneGraphComponent != null && result.result) {
      assertExist(result.data);
      const intersectedPositionInWorld = sceneGraphComponent.matrixInner.multiplyVector3To(
        result.data.position,
        _MeshComponent.Td
      );
      return {
        result: true,
        data: {
          t: result.data.t,
          u: result.data.u,
          v: result.data.v,
          position: intersectedPositionInWorld
        }
      };
    }
    return result;
  }
  /**
   * Loads and initializes the mesh data, performing necessary calculations.
   * This method calculates tangents, face normals, and barycentric coordinates
   * if blend shapes are present, then moves to the Logic processing stage.
   */
  $load() {
    if (this.Rd == null) {
      return;
    }
    this.Rd._calcTangents();
    this.Rd._calcFaceNormalsIfNonNormal();
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    if (blendShapeComponent != null && blendShapeComponent.weights.length > 0) {
      this.Rd._calcBaryCentricCoord();
    }
    this.moveStageTo(ProcessStage.Logic);
  }
  /**
   * Updates the 3D API vertex data by recreating VBO and VAO.
   * This is called internally when vertex data needs to be refreshed.
   * @private
   */
  Ud() {
    if (this.Rd != null) {
      this.Rd.delete3DAPIVertexData();
      this.Rd._updateVBOAndVAO();
    }
  }
  /**
   * Calculates barycentric coordinates for all mesh primitives.
   * This converts indexed geometry to unindexed geometry and updates
   * the 3D API vertex data afterwards.
   */
  calcBaryCentricCoord() {
    if (this.Rd != null) {
      for (const primitive of this.Rd.primitives) {
        primitive.convertToUnindexedGeometry();
      }
      this.Rd._calcBaryCentricCoord();
    }
    this.Ud();
  }
  /**
   * Logic processing stage method. Currently empty but can be overridden
   * for custom logic processing during the component's lifecycle.
   */
  $logic() {
  }
  /**
   * Performs a shallow copy of data from another MeshComponent.
   * @param component_ - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component_) {
    const component = component_;
    this.Sd = component.Sd;
    if (Is.exist(component.Rd)) {
      this.setMesh(component.Rd);
    }
    this.isPickable = component.isPickable;
  }
  /**
   * Destroys the component and cleans up resources.
   * Properly releases GPU resources to prevent memory leaks and display corruption.
   * @protected
   */
  _destroy() {
    super._destroy();
    if (this.Rd) {
      const mesh = this.Rd;
      mesh._removeMeshComponent(this);
      const isShared = mesh.meshEntitiesInner.length > 0;
      if (!isShared) {
        mesh.delete3DAPIVertexData();
        mesh.deleteVAO();
      }
      this.Rd = void 0;
    }
  }
  /**
   * Gets the entity which has this component with proper typing.
   * @returns The entity which has this component as an IMeshEntity
   */
  get entity() {
    return this.c.entityRepository.getEntity(this.Qb);
  }
  /**
   * Adds this component to an entity by extending the entity class with mesh-specific methods.
   * This method applies mixins to add getMesh() method to the target entity.
   * @param base - The target entity to extend
   * @param _componentClass - The component class to add (not used but required by interface)
   * @returns The extended entity with mesh component methods
   * @template EntityBase - The base entity type
   * @template SomeComponentClass - The component class type
   */
  addThisComponentToEntity(base, _componentClass) {
    class MeshEntity extends base.constructor {
      getMesh() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID);
      }
    }
    applyMixins(base, MeshEntity);
    return base;
  }
};
_MeshComponent.Hc = MutableVector3.zero();
_MeshComponent.Dc = MutableVector3.zero();
_MeshComponent.Ec = MutableVector3.zero();
_MeshComponent.Td = MutableVector3.zero();
_MeshComponent.zc = MutableMatrix44.zero();
_MeshComponent.Vd = 0;
var MeshComponent = _MeshComponent;
export {
  MeshComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9NZXNoL01lc2hDb21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgQ29tcG9uZW50VElEIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi4vLi4vY29yZS9Db21wb25lbnQnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vLi4vY29yZS9FbnRpdHknO1xuaW1wb3J0IHsgYXBwbHlNaXhpbnMgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUHJvY2Vzc1N0YWdlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc1N0YWdlJztcbmltcG9ydCB0eXBlIHsgTWVzaCB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L01lc2gnO1xuaW1wb3J0IHR5cGUgeyBSYXljYXN0UmVzdWx0RXgxIH0gZnJvbSAnLi4vLi4vZ2VvbWV0cnkvdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5pbXBvcnQgdHlwZSB7IElNZXNoRW50aXR5IH0gZnJvbSAnLi4vLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgTWF0aENsYXNzVXRpbCB9IGZyb20gJy4uLy4uL21hdGgvTWF0aENsYXNzVXRpbCc7XG5pbXBvcnQgeyBNYXRyaXg0NCB9IGZyb20gJy4uLy4uL21hdGgvTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yNCB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yNCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uLy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgYXNzZXJ0RXhpc3QgfSBmcm9tICcuLi8uLi9taXNjL01pc2NVdGlsJztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9XZWxsS25vd25Db21wb25lbnRUSURzJztcblxuLyoqXG4gKiBNZXNoQ29tcG9uZW50IGlzIGEgY29tcG9uZW50IHRoYXQgbWFuYWdlcyBhIG1lc2ggZ2VvbWV0cnkgZm9yIGFuIGVudGl0eS5cbiAqIEl0IHByb3ZpZGVzIGZ1bmN0aW9uYWxpdHkgZm9yIG1lc2ggbWFuYWdlbWVudCwgcmF5IGNhc3RpbmcsIGRlcHRoIGNhbGN1bGF0aW9uLFxuICogYW5kIHZlcnRleCBkYXRhIHVwZGF0ZXMgZm9yIDNEIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lc2hDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIF9fdmlld0RlcHRoID0gLU51bWJlci5NQVhfVkFMVUU7XG4gIHByaXZhdGUgX19tZXNoPzogTWVzaDtcbiAgcHVibGljIGlzUGlja2FibGUgPSB0cnVlO1xuXG4gIHByaXZhdGUgc3RhdGljIF9fdG1wVmVjdG9yM18wOiBNdXRhYmxlVmVjdG9yMyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBWZWN0b3IzXzE6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjNfMjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgc3RhdGljIF9fcmV0dXJuVmVjdG9yMzogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX190bXBNYXRyaXg0NF8wOiBNdXRhYmxlTWF0cml4NDQgPSBNdXRhYmxlTWF0cml4NDQuemVybygpO1xuICBwcml2YXRlIHN0YXRpYyBfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gMDtcblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgTWVzaENvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEIGZvciBtZXNoIGNvbXBvbmVudHNcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLk1lc2hDb21wb25lbnRUSUQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyBpbnN0YW5jZS5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEIGZvciBtZXNoIGNvbXBvbmVudHNcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5NZXNoQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZXMgYSBtZXNoIHdpdGggdGhpcyBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBtZXNoIC0gVGhlIG1lc2ggdG8gYmUgYXNzaWduZWQgdG8gdGhpcyBjb21wb25lbnRcbiAgICovXG4gIHNldE1lc2gobWVzaDogTWVzaCkge1xuICAgIGlmICh0aGlzLl9fbWVzaCA9PT0gbWVzaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21lc2gpIHtcbiAgICAgIHRoaXMuX19tZXNoLl9yZW1vdmVNZXNoQ29tcG9uZW50KHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLl9fbWVzaCA9IG1lc2g7XG4gICAgbWVzaC5fYmVsb25nVG9NZXNoQ29tcG9uZW50KHRoaXMpO1xuICAgIC8vIFRoZSBtZXNoIGNvbnRyaWJ1dGVzIHRvIHRoZSBtZXJnZWQgd29ybGQgQUFCQiBvZiB0aGlzIGVudGl0eSBhbmQgaXRzIGFuY2VzdG9ycy4gVGhlXG4gICAgLy8gbWVyZ2VkIEFBQkIgbWF5IGhhdmUgYmVlbiBjb21wdXRlZCBiZWZvcmUgdGhlIG1lc2ggd2FzIGF0dGFjaGVkIChmb3IgZXhhbXBsZSBkdXJpbmdcbiAgICAvLyBlbnRpdHkgY3JlYXRpb24pLCBzbyBpdCBoYXMgdG8gYmUgcmVjb21wdXRlZCBub3cuXG4gICAgdGhpcy5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk/LnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBtZXNoIGFzc29jaWF0aW9uIGZyb20gdGhpcyBjb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYSBtZXNoIHdhcyBzdWNjZXNzZnVsbHkgdW5zZXQsIGZhbHNlIGlmIG5vIG1lc2ggd2FzIHNldFxuICAgKi9cbiAgdW5zZXRNZXNoKCkge1xuICAgIGlmICh0aGlzLl9fbWVzaCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX19tZXNoLl9yZW1vdmVNZXNoQ29tcG9uZW50KHRoaXMpO1xuICAgIHRoaXMuX19tZXNoID0gdm9pZCAwO1xuICAgIHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpPy5zZXRXb3JsZEFBQkJEaXJ0eVBhcmVudFJlY3Vyc2l2ZWx5KCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZXNoIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNvbXBvbmVudC5cbiAgICogQHJldHVybnMgVGhlIG1lc2ggaW5zdGFuY2UsIG9yIHVuZGVmaW5lZCBpZiBubyBtZXNoIGlzIHNldFxuICAgKi9cbiAgZ2V0IG1lc2goKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tZXNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHZpZXcgZGVwdGggb2YgdGhlIG1lc2ggY2VudGVyIGZyb20gdGhlIGdpdmVuIGNhbWVyYSdzIHBlcnNwZWN0aXZlLlxuICAgKiBUaGlzIGlzIHVzZWQgZm9yIGRlcHRoIHNvcnRpbmcgYW5kIHJlbmRlcmluZyBvcmRlciBkZXRlcm1pbmF0aW9uLlxuICAgKiBAcGFyYW0gY2FtZXJhQ29tcG9uZW50IC0gVGhlIGNhbWVyYSBjb21wb25lbnQgdG8gY2FsY3VsYXRlIGRlcHRoIGZyb21cbiAgICogQHJldHVybnMgVGhlIGRlcHRoIHZhbHVlIGluIHZpZXcgc3BhY2UgKG5lZ2F0aXZlIFogdmFsdWUpLCBvciBOdW1iZXIuTUFYX1ZBTFVFIGlmIG5vIG1lc2ggaXMgc2V0XG4gICAqL1xuICBjYWxjVmlld0RlcHRoKGNhbWVyYUNvbXBvbmVudDogQ2FtZXJhQ29tcG9uZW50KSB7XG4gICAgaWYgKElzLm5vdC5leGlzdCh0aGlzLl9fbWVzaCkpIHtcbiAgICAgIHJldHVybiBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIH1cblxuICAgIGNvbnN0IGNlbnRlclBvc2l0aW9uX2luTG9jYWwgPSB0aGlzLl9fbWVzaC5BQUJCLmNlbnRlclBvaW50O1xuICAgIGNvbnN0IHNrZWxldGFsID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRTa2VsZXRhbCgpO1xuICAgIGlmIChJcy5leGlzdChza2VsZXRhbCkgJiYgSXMuZXhpc3Qoc2tlbGV0YWwuX2JpbmRTaGFwZU1hdHJpeCkpIHtcbiAgICAgIHNrZWxldGFsLl9iaW5kU2hhcGVNYXRyaXgubXVsdGlwbHlWZWN0b3IzVG8odGhpcy5fX21lc2guQUFCQi5jZW50ZXJQb2ludCwgY2VudGVyUG9zaXRpb25faW5Mb2NhbCk7XG4gICAgfVxuXG4gICAgY29uc3Qgd29ybGRNYXRyaXhJbm5lciA9IHRoaXMuZW50aXR5LmdldFNjZW5lR3JhcGgoKS5tYXRyaXhJbm5lcjtcbiAgICBjb25zdCBjZW50ZXJQb3NpdGlvbl9pbldvcmxkID0gd29ybGRNYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcjNUbyhcbiAgICAgIGNlbnRlclBvc2l0aW9uX2luTG9jYWwsXG4gICAgICBNZXNoQ29tcG9uZW50Ll9fdG1wVmVjdG9yM18wXG4gICAgKTtcblxuICAgIGNvbnN0IHZpZXdNYXRyaXggPSBjYW1lcmFDb21wb25lbnQudmlld01hdHJpeDtcbiAgICBjb25zdCBjZW50ZXJQb3NpdGlvbl9pblZpZXcgPSB2aWV3TWF0cml4Lm11bHRpcGx5VmVjdG9yM1RvKGNlbnRlclBvc2l0aW9uX2luV29ybGQsIE1lc2hDb21wb25lbnQuX190bXBWZWN0b3IzXzEpO1xuICAgIHRoaXMuX192aWV3RGVwdGggPSBjZW50ZXJQb3NpdGlvbl9pblZpZXcuejtcblxuICAgIHJldHVybiB0aGlzLl9fdmlld0RlcHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNhY2hlZCB2aWV3IGRlcHRoIHZhbHVlLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB2aWV3IGRlcHRoIHZhbHVlXG4gICAqL1xuICBnZXQgdmlld0RlcHRoKCkge1xuICAgIHJldHVybiB0aGlzLl9fdmlld0RlcHRoO1xuICB9XG5cbiAgLyoqXG4gICAqIExvZ3MgYSBkZWJ1ZyBtZXNzYWdlIHdoZW4gbm8gbWVzaCBpcyBzZXQgb24gYSBNZXNoQ29tcG9uZW50LlxuICAgKiBAcGFyYW0gbWVzaENvbXBvbmVudCAtIFRoZSBtZXNoIGNvbXBvbmVudCBpbnN0YW5jZSB0byBsb2cgYWJvdXRcbiAgICovXG4gIHN0YXRpYyBhbGVydE5vTWVzaFNldChtZXNoQ29tcG9uZW50OiBNZXNoQ29tcG9uZW50KSB7XG4gICAgTG9nZ2VyLmRlZmF1bHQuZGVidWcoYE5vIG1lc2ggaXMgc2V0IG9uIHRoaXMgTWVzaENvbXBvbmVudDoke21lc2hDb21wb25lbnQuY29tcG9uZW50U0lEfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHJheSBjYXN0aW5nIGFnYWluc3QgdGhlIG1lc2ggZ2VvbWV0cnkgaW4gd29ybGQgc3BhY2UuXG4gICAqIEBwYXJhbSBzcmNQb2ludEluV29ybGQgLSBUaGUgcmF5IG9yaWdpbiBwb2ludCBpbiB3b3JsZCBjb29yZGluYXRlc1xuICAgKiBAcGFyYW0gZGlyZWN0aW9uSW5Xb3JsZCAtIFRoZSByYXkgZGlyZWN0aW9uIHZlY3RvciBpbiB3b3JsZCBjb29yZGluYXRlc1xuICAgKiBAcGFyYW0gZG90VGhyZXNob2xkIC0gVGhlIGRvdCBwcm9kdWN0IHRocmVzaG9sZCBmb3IgZmFjZSBjdWxsaW5nIChkZWZhdWx0OiAwKVxuICAgKiBAcmV0dXJucyBSYXkgY2FzdGluZyByZXN1bHQgd2l0aCBpbnRlcnNlY3Rpb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGNhc3RSYXkoc3JjUG9pbnRJbldvcmxkOiBWZWN0b3IzLCBkaXJlY3Rpb25JbldvcmxkOiBWZWN0b3IzLCBkb3RUaHJlc2hvbGQgPSAwKTogUmF5Y2FzdFJlc3VsdEV4MSB7XG4gICAgaWYgKHRoaXMuX19tZXNoKSB7XG4gICAgICBsZXQgc3JjUG9pbnRJbkxvY2FsID0gc3JjUG9pbnRJbldvcmxkO1xuICAgICAgbGV0IGRpcmVjdGlvbkluTG9jYWwgPSBkaXJlY3Rpb25JbldvcmxkO1xuICAgICAgY29uc3Qgc2NlbmVHcmFwaENvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgICAgaWYgKHNjZW5lR3JhcGhDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBpbnZXb3JsZE1hdHJpeCA9IE1hdHJpeDQ0LmludmVydChzY2VuZUdyYXBoQ29tcG9uZW50Lm1hdHJpeElubmVyKTtcbiAgICAgICAgc3JjUG9pbnRJbkxvY2FsID0gVmVjdG9yMy5mcm9tQ29weVZlY3RvcjQoXG4gICAgICAgICAgaW52V29ybGRNYXRyaXgubXVsdGlwbHlWZWN0b3IoVmVjdG9yNC5mcm9tQ29weVZlY3RvcjMoc3JjUG9pbnRJbldvcmxkKSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGlzdFZlY0luV29ybGQgPSBWZWN0b3IzLmFkZChzcmNQb2ludEluV29ybGQsIGRpcmVjdGlvbkluV29ybGQpO1xuICAgICAgICBjb25zdCBkaXN0VmVjSW5Mb2NhbCA9IFZlY3RvcjMuZnJvbUNvcHlWZWN0b3I0KFxuICAgICAgICAgIGludldvcmxkTWF0cml4Lm11bHRpcGx5VmVjdG9yKFZlY3RvcjQuZnJvbUNvcHlWZWN0b3IzKGRpc3RWZWNJbldvcmxkKSlcbiAgICAgICAgKTtcbiAgICAgICAgZGlyZWN0aW9uSW5Mb2NhbCA9IFZlY3RvcjMubm9ybWFsaXplKFZlY3RvcjMuc3VidHJhY3QoZGlzdFZlY0luTG9jYWwsIHNyY1BvaW50SW5Mb2NhbCkpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19tZXNoLmNhc3RSYXkoc3JjUG9pbnRJbkxvY2FsLCBkaXJlY3Rpb25JbkxvY2FsLCBkb3RUaHJlc2hvbGQpO1xuICAgICAgICBsZXQgaW50ZXJzZWN0UG9zaXRpb25JbldvcmxkID0gbnVsbDtcbiAgICAgICAgaWYgKElzLmRlZmluZWQocmVzdWx0LmRhdGEpICYmIHJlc3VsdC5kYXRhLnQgPj0gMCkge1xuICAgICAgICAgIGludGVyc2VjdFBvc2l0aW9uSW5Xb3JsZCA9IFZlY3RvcjMuZnJvbUNvcHlWZWN0b3I0KFxuICAgICAgICAgICAgc2NlbmVHcmFwaENvbXBvbmVudC5tYXRyaXhJbm5lci5tdWx0aXBseVZlY3RvcihWZWN0b3I0LmZyb21Db3B5VmVjdG9yMyhyZXN1bHQuZGF0YS5wb3NpdGlvbikpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN1bHQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHQ6IHJlc3VsdC5kYXRhLnQsXG4gICAgICAgICAgICAgIHU6IHJlc3VsdC5kYXRhLnUsXG4gICAgICAgICAgICAgIHY6IHJlc3VsdC5kYXRhLnYsXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiBpbnRlcnNlY3RQb3NpdGlvbkluV29ybGQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHJheSBjYXN0aW5nIGZyb20gc2NyZWVuIGNvb3JkaW5hdGVzIGFnYWluc3QgdGhlIG1lc2ggaW4gbG9jYWwgc3BhY2UuXG4gICAqIEBwYXJhbSB4IC0gVGhlIFggY29vcmRpbmF0ZSBpbiBzY3JlZW4gc3BhY2VcbiAgICogQHBhcmFtIHkgLSBUaGUgWSBjb29yZGluYXRlIGluIHNjcmVlbiBzcGFjZVxuICAgKiBAcGFyYW0gY2FtZXJhIC0gVGhlIGNhbWVyYSBjb21wb25lbnQgZm9yIHByb2plY3Rpb24gY2FsY3VsYXRpb25zXG4gICAqIEBwYXJhbSB2aWV3cG9ydCAtIFRoZSB2aWV3cG9ydCBkaW1lbnNpb25zIGFzIFZlY3RvcjQgKHgsIHksIHdpZHRoLCBoZWlnaHQpXG4gICAqIEBwYXJhbSBkb3RUaHJlc2hvbGQgLSBUaGUgZG90IHByb2R1Y3QgdGhyZXNob2xkIGZvciBmYWNlIGN1bGxpbmcgKGRlZmF1bHQ6IDApXG4gICAqIEByZXR1cm5zIFJheSBjYXN0aW5nIHJlc3VsdCB3aXRoIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbiBpbiBsb2NhbCBzcGFjZVxuICAgKi9cbiAgY2FzdFJheUZyb21TY3JlZW5JbkxvY2FsKFxuICAgIHg6IG51bWJlcixcbiAgICB5OiBudW1iZXIsXG4gICAgY2FtZXJhOiBDYW1lcmFDb21wb25lbnQsXG4gICAgdmlld3BvcnQ6IFZlY3RvcjQsXG4gICAgZG90VGhyZXNob2xkID0gMFxuICApOiBSYXljYXN0UmVzdWx0RXgxIHtcbiAgICBpZiAodGhpcy5fX21lc2gpIHtcbiAgICAgIGNvbnN0IHNjZW5lR3JhcGhDb21wb25lbnQgPSB0aGlzLmVudGl0eS50cnlUb0dldFNjZW5lR3JhcGgoKTtcbiAgICAgIGlmIChzY2VuZUdyYXBoQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgaW52UFZXID0gTXV0YWJsZU1hdHJpeDQ0Lm11bHRpcGx5VG8oXG4gICAgICAgICAgY2FtZXJhLnByb2plY3Rpb25NYXRyaXgsXG4gICAgICAgICAgY2FtZXJhLnZpZXdNYXRyaXgsXG4gICAgICAgICAgTWVzaENvbXBvbmVudC5fX3RtcE1hdHJpeDQ0XzBcbiAgICAgICAgKVxuICAgICAgICAgIC5tdWx0aXBseShzY2VuZUdyYXBoQ29tcG9uZW50Lm1hdHJpeElubmVyKVxuICAgICAgICAgIC5pbnZlcnQoKTtcblxuICAgICAgICBjb25zdCBzcmNQb2ludEluTG9jYWwgPSBNYXRoQ2xhc3NVdGlsLnVuUHJvamVjdFRvKHgsIHksIDAsIGludlBWVywgdmlld3BvcnQsIE1lc2hDb21wb25lbnQuX190bXBWZWN0b3IzXzApO1xuICAgICAgICBjb25zdCBkaXN0VmVjSW5Mb2NhbCA9IE1hdGhDbGFzc1V0aWwudW5Qcm9qZWN0VG8oeCwgeSwgMSwgaW52UFZXLCB2aWV3cG9ydCwgTWVzaENvbXBvbmVudC5fX3RtcFZlY3RvcjNfMSk7XG5cbiAgICAgICAgY29uc3QgZGlyZWN0aW9uSW5Mb2NhbCA9IE11dGFibGVWZWN0b3IzLnN1YnRyYWN0VG8oXG4gICAgICAgICAgZGlzdFZlY0luTG9jYWwsXG4gICAgICAgICAgc3JjUG9pbnRJbkxvY2FsLFxuICAgICAgICAgIE1lc2hDb21wb25lbnQuX190bXBWZWN0b3IzXzJcbiAgICAgICAgKS5ub3JtYWxpemUoKTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9fbWVzaC5jYXN0UmF5KHNyY1BvaW50SW5Mb2NhbCwgZGlyZWN0aW9uSW5Mb2NhbCwgZG90VGhyZXNob2xkKTtcbiAgICAgICAgaWYgKElzLmRlZmluZWQocmVzdWx0LmRhdGEpICYmIHJlc3VsdC5kYXRhLnQgPj0gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN1bHQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIHQ6IHJlc3VsdC5kYXRhLnQsXG4gICAgICAgICAgICAgIHU6IHJlc3VsdC5kYXRhLnUsXG4gICAgICAgICAgICAgIHY6IHJlc3VsdC5kYXRhLnYsXG4gICAgICAgICAgICAgIHBvc2l0aW9uOiByZXN1bHQuZGF0YS5wb3NpdGlvbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICByZXN1bHQ6IGZhbHNlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgcmF5IGNhc3RpbmcgZnJvbSBzY3JlZW4gY29vcmRpbmF0ZXMgYWdhaW5zdCB0aGUgbWVzaCBpbiB3b3JsZCBzcGFjZS5cbiAgICogQHBhcmFtIHggLSBUaGUgWCBjb29yZGluYXRlIGluIHNjcmVlbiBzcGFjZVxuICAgKiBAcGFyYW0geSAtIFRoZSBZIGNvb3JkaW5hdGUgaW4gc2NyZWVuIHNwYWNlXG4gICAqIEBwYXJhbSBjYW1lcmEgLSBUaGUgY2FtZXJhIGNvbXBvbmVudCBmb3IgcHJvamVjdGlvbiBjYWxjdWxhdGlvbnNcbiAgICogQHBhcmFtIHZpZXdwb3J0IC0gVGhlIHZpZXdwb3J0IGRpbWVuc2lvbnMgYXMgVmVjdG9yNCAoeCwgeSwgd2lkdGgsIGhlaWdodClcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIFRoZSBkb3QgcHJvZHVjdCB0aHJlc2hvbGQgZm9yIGZhY2UgY3VsbGluZyAoZGVmYXVsdDogMClcbiAgICogQHJldHVybnMgUmF5IGNhc3RpbmcgcmVzdWx0IHdpdGggaW50ZXJzZWN0aW9uIGluZm9ybWF0aW9uIGluIHdvcmxkIHNwYWNlXG4gICAqL1xuICBjYXN0UmF5RnJvbVNjcmVlbkluV29ybGQoXG4gICAgeDogbnVtYmVyLFxuICAgIHk6IG51bWJlcixcbiAgICBjYW1lcmE6IENhbWVyYUNvbXBvbmVudCxcbiAgICB2aWV3cG9ydDogVmVjdG9yNCxcbiAgICBkb3RUaHJlc2hvbGQgPSAwXG4gICk6IFJheWNhc3RSZXN1bHRFeDEge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuY2FzdFJheUZyb21TY3JlZW5JbkxvY2FsKHgsIHksIGNhbWVyYSwgdmlld3BvcnQsIGRvdFRocmVzaG9sZCk7XG4gICAgY29uc3Qgc2NlbmVHcmFwaENvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmICh0aGlzLl9fbWVzaCAmJiBzY2VuZUdyYXBoQ29tcG9uZW50ICE9IG51bGwgJiYgcmVzdWx0LnJlc3VsdCkge1xuICAgICAgYXNzZXJ0RXhpc3QocmVzdWx0LmRhdGEpO1xuXG4gICAgICAvLyBjb252ZXJ0IHRvIFdvcmxkIHNwYWNlXG4gICAgICBjb25zdCBpbnRlcnNlY3RlZFBvc2l0aW9uSW5Xb3JsZCA9IHNjZW5lR3JhcGhDb21wb25lbnQubWF0cml4SW5uZXIubXVsdGlwbHlWZWN0b3IzVG8oXG4gICAgICAgIHJlc3VsdC5kYXRhLnBvc2l0aW9uLFxuICAgICAgICBNZXNoQ29tcG9uZW50Ll9fcmV0dXJuVmVjdG9yM1xuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIHQ6IHJlc3VsdC5kYXRhLnQsXG4gICAgICAgICAgdTogcmVzdWx0LmRhdGEudSxcbiAgICAgICAgICB2OiByZXN1bHQuZGF0YS52LFxuICAgICAgICAgIHBvc2l0aW9uOiBpbnRlcnNlY3RlZFBvc2l0aW9uSW5Xb3JsZCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYW5kIGluaXRpYWxpemVzIHRoZSBtZXNoIGRhdGEsIHBlcmZvcm1pbmcgbmVjZXNzYXJ5IGNhbGN1bGF0aW9ucy5cbiAgICogVGhpcyBtZXRob2QgY2FsY3VsYXRlcyB0YW5nZW50cywgZmFjZSBub3JtYWxzLCBhbmQgYmFyeWNlbnRyaWMgY29vcmRpbmF0ZXNcbiAgICogaWYgYmxlbmQgc2hhcGVzIGFyZSBwcmVzZW50LCB0aGVuIG1vdmVzIHRvIHRoZSBMb2dpYyBwcm9jZXNzaW5nIHN0YWdlLlxuICAgKi9cbiAgJGxvYWQoKSB7XG4gICAgaWYgKHRoaXMuX19tZXNoID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gICAgdGhpcy5fX21lc2ghLm1ha2VWZXJ0aWNlc1NlcGFyYXRlZCgpO1xuICAgIHRoaXMuX19tZXNoLl9jYWxjVGFuZ2VudHMoKTtcbiAgICAvLyB0aGlzLl9fbWVzaC5fX2luaXRNb3JwaFByaW1pdGl2ZXMoKTtcbiAgICB0aGlzLl9fbWVzaCEuX2NhbGNGYWNlTm9ybWFsc0lmTm9uTm9ybWFsKCk7XG4gICAgY29uc3QgYmxlbmRTaGFwZUNvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0QmxlbmRTaGFwZSgpO1xuICAgIGlmIChibGVuZFNoYXBlQ29tcG9uZW50ICE9IG51bGwgJiYgYmxlbmRTaGFwZUNvbXBvbmVudC53ZWlnaHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuX19tZXNoIS5fY2FsY0JhcnlDZW50cmljQ29vcmQoKTtcbiAgICB9XG4gICAgdGhpcy5tb3ZlU3RhZ2VUbyhQcm9jZXNzU3RhZ2UuTG9naWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIDNEIEFQSSB2ZXJ0ZXggZGF0YSBieSByZWNyZWF0aW5nIFZCTyBhbmQgVkFPLlxuICAgKiBUaGlzIGlzIGNhbGxlZCBpbnRlcm5hbGx5IHdoZW4gdmVydGV4IGRhdGEgbmVlZHMgdG8gYmUgcmVmcmVzaGVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX3VwZGF0ZTNEQVBJVmVydGV4RGF0YSgpIHtcbiAgICBpZiAodGhpcy5fX21lc2ggIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX21lc2guZGVsZXRlM0RBUElWZXJ0ZXhEYXRhKCk7XG4gICAgICB0aGlzLl9fbWVzaC5fdXBkYXRlVkJPQW5kVkFPKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYmFyeWNlbnRyaWMgY29vcmRpbmF0ZXMgZm9yIGFsbCBtZXNoIHByaW1pdGl2ZXMuXG4gICAqIFRoaXMgY29udmVydHMgaW5kZXhlZCBnZW9tZXRyeSB0byB1bmluZGV4ZWQgZ2VvbWV0cnkgYW5kIHVwZGF0ZXNcbiAgICogdGhlIDNEIEFQSSB2ZXJ0ZXggZGF0YSBhZnRlcndhcmRzLlxuICAgKi9cbiAgY2FsY0JhcnlDZW50cmljQ29vcmQoKSB7XG4gICAgaWYgKHRoaXMuX19tZXNoICE9IG51bGwpIHtcbiAgICAgIGZvciAoY29uc3QgcHJpbWl0aXZlIG9mIHRoaXMuX19tZXNoLnByaW1pdGl2ZXMpIHtcbiAgICAgICAgcHJpbWl0aXZlLmNvbnZlcnRUb1VuaW5kZXhlZEdlb21ldHJ5KCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fbWVzaC5fY2FsY0JhcnlDZW50cmljQ29vcmQoKTtcbiAgICB9XG4gICAgdGhpcy5fX3VwZGF0ZTNEQVBJVmVydGV4RGF0YSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvZ2ljIHByb2Nlc3Npbmcgc3RhZ2UgbWV0aG9kLiBDdXJyZW50bHkgZW1wdHkgYnV0IGNhbiBiZSBvdmVycmlkZGVuXG4gICAqIGZvciBjdXN0b20gbG9naWMgcHJvY2Vzc2luZyBkdXJpbmcgdGhlIGNvbXBvbmVudCdzIGxpZmVjeWNsZS5cbiAgICovXG4gICRsb2dpYygpIHt9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgc2hhbGxvdyBjb3B5IG9mIGRhdGEgZnJvbSBhbm90aGVyIE1lc2hDb21wb25lbnQuXG4gICAqIEBwYXJhbSBjb21wb25lbnRfIC0gVGhlIHNvdXJjZSBjb21wb25lbnQgdG8gY29weSBmcm9tXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9zaGFsbG93Q29weUZyb20oY29tcG9uZW50XzogQ29tcG9uZW50KTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gY29tcG9uZW50XyBhcyBNZXNoQ29tcG9uZW50O1xuICAgIHRoaXMuX192aWV3RGVwdGggPSBjb21wb25lbnQuX192aWV3RGVwdGg7XG4gICAgaWYgKElzLmV4aXN0KGNvbXBvbmVudC5fX21lc2gpKSB7XG4gICAgICB0aGlzLnNldE1lc2goY29tcG9uZW50Ll9fbWVzaCk7XG4gICAgfVxuICAgIHRoaXMuaXNQaWNrYWJsZSA9IGNvbXBvbmVudC5pc1BpY2thYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBjb21wb25lbnQgYW5kIGNsZWFucyB1cCByZXNvdXJjZXMuXG4gICAqIFByb3Blcmx5IHJlbGVhc2VzIEdQVSByZXNvdXJjZXMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgYW5kIGRpc3BsYXkgY29ycnVwdGlvbi5cbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgX2Rlc3Ryb3koKTogdm9pZCB7XG4gICAgc3VwZXIuX2Rlc3Ryb3koKTtcbiAgICBpZiAodGhpcy5fX21lc2gpIHtcbiAgICAgIGNvbnN0IG1lc2ggPSB0aGlzLl9fbWVzaDtcbiAgICAgIG1lc2guX3JlbW92ZU1lc2hDb21wb25lbnQodGhpcyk7XG4gICAgICBjb25zdCBpc1NoYXJlZCA9IG1lc2gubWVzaEVudGl0aWVzSW5uZXIubGVuZ3RoID4gMDtcbiAgICAgIGlmICghaXNTaGFyZWQpIHtcbiAgICAgICAgLy8gRGVsZXRlIEdQVSB2ZXJ0ZXggZGF0YSAoVkJPLCBWQU8sIHNrZWxldGFsIGF0dHJpYnV0ZXMpIG9ubHkgd2hlbiBubyBvdGhlciBjb21wb25lbnQgdXNlcyB0aGlzIG1lc2hcbiAgICAgICAgbWVzaC5kZWxldGUzREFQSVZlcnRleERhdGEoKTtcbiAgICAgICAgbWVzaC5kZWxldGVWQU8oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19tZXNoID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBlbnRpdHkgd2hpY2ggaGFzIHRoaXMgY29tcG9uZW50IHdpdGggcHJvcGVyIHR5cGluZy5cbiAgICogQHJldHVybnMgVGhlIGVudGl0eSB3aGljaCBoYXMgdGhpcyBjb21wb25lbnQgYXMgYW4gSU1lc2hFbnRpdHlcbiAgICovXG4gIGdldCBlbnRpdHkoKTogSU1lc2hFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lLmVudGl0eVJlcG9zaXRvcnkuZ2V0RW50aXR5KHRoaXMuX19lbnRpdHlVaWQpIGFzIHVua25vd24gYXMgSU1lc2hFbnRpdHk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGlzIGNvbXBvbmVudCB0byBhbiBlbnRpdHkgYnkgZXh0ZW5kaW5nIHRoZSBlbnRpdHkgY2xhc3Mgd2l0aCBtZXNoLXNwZWNpZmljIG1ldGhvZHMuXG4gICAqIFRoaXMgbWV0aG9kIGFwcGxpZXMgbWl4aW5zIHRvIGFkZCBnZXRNZXNoKCkgbWV0aG9kIHRvIHRoZSB0YXJnZXQgZW50aXR5LlxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5IHRvIGV4dGVuZFxuICAgKiBAcGFyYW0gX2NvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBhZGQgKG5vdCB1c2VkIGJ1dCByZXF1aXJlZCBieSBpbnRlcmZhY2UpXG4gICAqIEByZXR1cm5zIFRoZSBleHRlbmRlZCBlbnRpdHkgd2l0aCBtZXNoIGNvbXBvbmVudCBtZXRob2RzXG4gICAqIEB0ZW1wbGF0ZSBFbnRpdHlCYXNlIC0gVGhlIGJhc2UgZW50aXR5IHR5cGVcbiAgICogQHRlbXBsYXRlIFNvbWVDb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdHlwZVxuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIGNsYXNzIE1lc2hFbnRpdHkgZXh0ZW5kcyAoYmFzZS5jb25zdHJ1Y3RvciBhcyBhbnkpIHtcbiAgICAgIGdldE1lc2goKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuTWVzaENvbXBvbmVudFRJRCkgYXMgTWVzaENvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgYXBwbHlNaXhpbnMoYmFzZSwgTWVzaEVudGl0eSk7XG4gICAgcmV0dXJuIGJhc2UgYXMgdW5rbm93biBhcyBDb21wb25lbnRUb0NvbXBvbmVudE1ldGhvZHM8U29tZUNvbXBvbmVudENsYXNzPiAmIEVudGl0eUJhc2U7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGlCQUFpQjtBQUUxQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUk3QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsVUFBVTtBQUNuQixTQUFTLGNBQWM7QUFDdkIsU0FBUyxtQkFBbUI7QUFHNUIsU0FBUyw4QkFBOEI7QUFPaEMsSUFBTSxpQkFBTixNQUFNLHVCQUFzQixVQUFVO0FBQUEsRUFBdEM7QUFBQTtBQUNMLFNBQVFBLEtBQWMsQ0FBQyxPQUFPO0FBRTlCLFNBQU8sYUFBYTtBQUFBO0FBQUE7QUFBQTtBQUFB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LEtBQUtBO0FBQ2xCLFdBQUsscUJBQXFCLElBQUk7QUFDOUIsWUFBTSxXQUFXLEtBQUssa0JBQWtCLFNBQVM7QUFDakQsVUFBSSxDQUFDLFVBQVU7QUFFYixhQUFLLHNCQUFzQjtBQUMzQixhQUFLLFVBQVU7QUFBQSxNQUNqQjtBQUNBLFdBQUtBLEtBQVM7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxTQUFzQjtBQUN4QixXQUFPLEtBQUtPLEVBQVMsaUJBQWlCLFVBQVUsS0FBS0MsRUFBVztBQUFBLEVBQ2xFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSx5QkFDRSxNQUNBLGlCQUNBO0FBQUEsSUFDQSxNQUFNLG1CQUFvQixLQUFLLFlBQW9CO0FBQUEsTUFDakQsVUFBVTtBQUNSLGVBQU8sS0FBSywyQkFBMkIsdUJBQXVCLGdCQUFnQjtBQUFBLE1BQ2hGO0FBQUEsSUFDRjtBQUNBLGdCQUFZLE1BQU0sVUFBVTtBQUM1QixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBeFhhLGVBS0lQLEtBQWlDLGVBQWUsS0FBSztBQUx6RCxlQU1JQyxLQUFpQyxlQUFlLEtBQUs7QUFOekQsZUFPSUUsS0FBaUMsZUFBZSxLQUFLO0FBUHpELGVBUUlDLEtBQWtDLGVBQWUsS0FBSztBQVIxRCxlQVVJRixLQUFtQyxnQkFBZ0IsS0FBSztBQVY1RCxlQVdJTSxLQUEyQztBQVhyRCxJQUFNLGdCQUFOOyIsCiAgIm5hbWVzIjogWyJfX3ZpZXdEZXB0aCIsICJfX21lc2giLCAiX190bXBWZWN0b3IzXzAiLCAiX190bXBWZWN0b3IzXzEiLCAiX190bXBNYXRyaXg0NF8wIiwgIl9fdG1wVmVjdG9yM18yIiwgIl9fcmV0dXJuVmVjdG9yMyIsICJfX3VwZGF0ZTNEQVBJVmVydGV4RGF0YSIsICJfX2VuZ2luZSIsICJfX2VudGl0eVVpZCIsICJfX2xhdGVzdFByaW1pdGl2ZVBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uIl0KfQo=
