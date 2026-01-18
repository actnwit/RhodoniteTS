import type { ComponentTID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { Mesh } from '../../geometry/Mesh';
import type { RaycastResultEx1 } from '../../geometry/types/GeometryTypes';
import type { IMeshEntity } from '../../helpers/EntityHelper';
import { MathClassUtil } from '../../math/MathClassUtil';
import { Matrix44 } from '../../math/Matrix44';
import { MutableMatrix44 } from '../../math/MutableMatrix44';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';
import { Vector4 } from '../../math/Vector4';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import { assertExist } from '../../misc/MiscUtil';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/**
 * MeshComponent is a component that manages a mesh geometry for an entity.
 * It provides functionality for mesh management, ray casting, depth calculation,
 * and vertex data updates for 3D rendering.
 */
export class MeshComponent extends Component {
  private __viewDepth = -Number.MAX_VALUE;
  private __mesh?: Mesh;
  public isPickable = true;

  private static __tmpVector3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVector3_2: MutableVector3 = MutableVector3.zero();
  private static __returnVector3: MutableVector3 = MutableVector3.zero();

  private static __tmpMatrix44_0: MutableMatrix44 = MutableMatrix44.zero();
  private static __latestPrimitivePositionAccessorVersion = 0;

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
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.MeshComponentTID;
  }

  /**
   * Associates a mesh with this component.
   * @param mesh - The mesh to be assigned to this component
   */
  setMesh(mesh: Mesh) {
    if (this.__mesh === mesh) {
      return;
    }
    if (this.__mesh) {
      this.__mesh._removeMeshComponent(this);
    }
    this.__mesh = mesh;
    mesh._belongToMeshComponent(this);
  }

  /**
   * Removes the mesh association from this component.
   * @returns True if a mesh was successfully unset, false if no mesh was set
   */
  unsetMesh() {
    if (this.__mesh == null) {
      return false;
    }
    this.__mesh._removeMeshComponent(this);
    this.__mesh = void 0;

    return true;
  }

  /**
   * Gets the mesh associated with this component.
   * @returns The mesh instance, or undefined if no mesh is set
   */
  get mesh() {
    return this.__mesh;
  }

  /**
   * Calculates the view depth of the mesh center from the given camera's perspective.
   * This is used for depth sorting and rendering order determination.
   * @param cameraComponent - The camera component to calculate depth from
   * @returns The depth value in view space (negative Z value), or Number.MAX_VALUE if no mesh is set
   */
  calcViewDepth(cameraComponent: CameraComponent) {
    if (Is.not.exist(this.__mesh)) {
      return Number.MAX_VALUE;
    }

    const centerPosition_inLocal = this.__mesh.AABB.centerPoint;
    const skeletal = this.entity.tryToGetSkeletal();
    if (Is.exist(skeletal) && Is.exist(skeletal._bindShapeMatrix)) {
      skeletal._bindShapeMatrix.multiplyVector3To(this.__mesh.AABB.centerPoint, centerPosition_inLocal);
    }

    const worldMatrixInner = this.entity.getSceneGraph().matrixInner;
    const centerPosition_inWorld = worldMatrixInner.multiplyVector3To(
      centerPosition_inLocal,
      MeshComponent.__tmpVector3_0
    );

    const viewMatrix = cameraComponent.viewMatrix;
    const centerPosition_inView = viewMatrix.multiplyVector3To(centerPosition_inWorld, MeshComponent.__tmpVector3_1);
    this.__viewDepth = centerPosition_inView.z;

    return this.__viewDepth;
  }

  /**
   * Gets the cached view depth value.
   * @returns The current view depth value
   */
  get viewDepth() {
    return this.__viewDepth;
  }

  /**
   * Logs a debug message when no mesh is set on a MeshComponent.
   * @param meshComponent - The mesh component instance to log about
   */
  static alertNoMeshSet(meshComponent: MeshComponent) {
    Logger.default.debug(`No mesh is set on this MeshComponent:${meshComponent.componentSID}`);
  }

  /**
   * Performs ray casting against the mesh geometry in world space.
   * @param srcPointInWorld - The ray origin point in world coordinates
   * @param directionInWorld - The ray direction vector in world coordinates
   * @param dotThreshold - The dot product threshold for face culling (default: 0)
   * @returns Ray casting result with intersection information
   */
  castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold = 0): RaycastResultEx1 {
    if (this.__mesh) {
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

        const result = this.__mesh.castRay(srcPointInLocal, directionInLocal, dotThreshold);
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
              position: intersectPositionInWorld,
            },
          };
        }
      }
    }

    return {
      result: false,
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
  castRayFromScreenInLocal(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    dotThreshold = 0
  ): RaycastResultEx1 {
    if (this.__mesh) {
      const sceneGraphComponent = this.entity.tryToGetSceneGraph();
      if (sceneGraphComponent != null) {
        const invPVW = MutableMatrix44.multiplyTo(
          camera.projectionMatrix,
          camera.viewMatrix,
          MeshComponent.__tmpMatrix44_0
        )
          .multiply(sceneGraphComponent.matrixInner)
          .invert();

        const srcPointInLocal = MathClassUtil.unProjectTo(x, y, 0, invPVW, viewport, MeshComponent.__tmpVector3_0);
        const distVecInLocal = MathClassUtil.unProjectTo(x, y, 1, invPVW, viewport, MeshComponent.__tmpVector3_1);

        const directionInLocal = MutableVector3.subtractTo(
          distVecInLocal,
          srcPointInLocal,
          MeshComponent.__tmpVector3_2
        ).normalize();

        const result = this.__mesh.castRay(srcPointInLocal, directionInLocal, dotThreshold);
        if (Is.defined(result.data) && result.data.t >= 0) {
          return {
            result: true,
            data: {
              t: result.data.t,
              u: result.data.u,
              v: result.data.v,
              position: result.data.position,
            },
          };
        }
      }
    }

    return {
      result: false,
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
  castRayFromScreenInWorld(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    dotThreshold = 0
  ): RaycastResultEx1 {
    const result = this.castRayFromScreenInLocal(x, y, camera, viewport, dotThreshold);
    const sceneGraphComponent = this.entity.tryToGetSceneGraph();
    if (this.__mesh && sceneGraphComponent != null && result.result) {
      assertExist(result.data);

      // convert to World space
      const intersectedPositionInWorld = sceneGraphComponent.matrixInner.multiplyVector3To(
        result.data.position,
        MeshComponent.__returnVector3
      );
      return {
        result: true,
        data: {
          t: result.data.t,
          u: result.data.u,
          v: result.data.v,
          position: intersectedPositionInWorld,
        },
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
    if (this.__mesh == null) {
      return;
    }
    //    this.__mesh!.makeVerticesSeparated();
    this.__mesh._calcTangents();
    // this.__mesh.__initMorphPrimitives();
    this.__mesh!._calcFaceNormalsIfNonNormal();
    const blendShapeComponent = this.entity.tryToGetBlendShape();
    if (blendShapeComponent != null && blendShapeComponent.weights.length > 0) {
      this.__mesh!._calcBaryCentricCoord();
    }
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Updates the 3D API vertex data by recreating VBO and VAO.
   * This is called internally when vertex data needs to be refreshed.
   * @private
   */
  private __update3DAPIVertexData() {
    if (this.__mesh != null) {
      this.__mesh.delete3DAPIVertexData();
      this.__mesh._updateVBOAndVAO();
    }
  }

  /**
   * Calculates barycentric coordinates for all mesh primitives.
   * This converts indexed geometry to unindexed geometry and updates
   * the 3D API vertex data afterwards.
   */
  calcBaryCentricCoord() {
    if (this.__mesh != null) {
      for (const primitive of this.__mesh.primitives) {
        primitive.convertToUnindexedGeometry();
      }
      this.__mesh._calcBaryCentricCoord();
    }
    this.__update3DAPIVertexData();
  }

  /**
   * Logic processing stage method. Currently empty but can be overridden
   * for custom logic processing during the component's lifecycle.
   */
  $logic() {}

  /**
   * Performs a shallow copy of data from another MeshComponent.
   * @param component_ - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component_: Component): void {
    const component = component_ as MeshComponent;
    this.__viewDepth = component.__viewDepth;
    if (Is.exist(component.__mesh)) {
      this.setMesh(component.__mesh);
    }
    this.isPickable = component.isPickable;
  }

  /**
   * Destroys the component and cleans up resources.
   * Properly releases GPU resources to prevent memory leaks and display corruption.
   * @protected
   */
  _destroy(): void {
    super._destroy();
    if (this.__mesh) {
      const mesh = this.__mesh;
      mesh._removeMeshComponent(this);
      const isShared = mesh.meshEntitiesInner.length > 0;
      if (!isShared) {
        // Delete GPU vertex data (VBO, VAO, skeletal attributes) only when no other component uses this mesh
        mesh.delete3DAPIVertexData();
        mesh.deleteVAO();
      }
      this.__mesh = undefined;
    }
  }

  /**
   * Gets the entity which has this component with proper typing.
   * @returns The entity which has this component as an IMeshEntity
   */
  get entity(): IMeshEntity {
    return this.__engine.entityRepository.getEntity(this.__entityUid) as unknown as IMeshEntity;
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
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class MeshEntity extends (base.constructor as any) {
      getMesh() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.MeshComponentTID) as MeshComponent;
      }
    }
    applyMixins(base, MeshEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
