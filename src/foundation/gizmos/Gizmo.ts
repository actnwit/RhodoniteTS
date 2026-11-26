import { CameraComponent } from '../components/Camera/CameraComponent';
import type { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { flattenHierarchy } from '../components/SceneGraph/SceneGraphOps';
import { RnObject } from '../core/RnObject';
import { CameraType } from '../definitions/CameraType';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IVector3 } from '../math/IVector';
import { MutableVector3 } from '../math/MutableVector3';
import type { Engine } from '../system/Engine';

/**
 * Abstract Gizmo class that provides a foundation for creating interactive gizmo objects
 * in 3D scenes. Gizmos are typically used for manipulation tools like transform handles,
 * rotation rings, or other interactive visual aids.
 */
export abstract class Gizmo extends RnObject {
  /** Scratch vector used to transform a world position into view space. */
  private static readonly __tmpViewPosition = MutableVector3.zero();

  /**
   * The top entity of this gizmo group.
   * A programmer who implements a gizmo class has to make this entity
   * a child of the target entity's scene graph component
   * that the gizmo will belong to manually.
   */
  protected __topEntity?: IMeshEntity | ISceneGraphEntity;
  /** the target entity which this gizmo belong to */
  protected __target: ISceneGraphEntity;

  protected __isVisible = false;

  protected __engine: Engine;

  /**
   * Creates a new Gizmo instance
   * @param target - The entity that this gizmo will be associated with and manipulate
   */
  constructor(engine: Engine, target: ISceneGraphEntity) {
    super();
    this.__engine = engine;
    this.__target = target;
    this.setGizmoTag();
  }

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Sets the visibility state of the gizmo
   * @param flg - True to make the gizmo visible, false to hide it
   */
  set isVisible(flg: boolean) {
    this.__setVisible(flg);
  }

  /**
   * Gets the current visibility state of the gizmo
   * @returns True if the gizmo is visible, false otherwise
   */
  get isVisible() {
    return this.__isVisible;
  }

  /**
   * Internal method to set the visibility of the gizmo and all its child entities
   * @param flg - True to show the gizmo, false to hide it
   */
  protected __setVisible(flg: boolean) {
    this.__isVisible = flg;
    if (this.__topEntity) {
      this.__topEntity.getSceneGraph()!.setVisibilityRecursively(flg);
    }
  }

  /**
   * Indicates whether the gizmo has been set up and is ready for use
   * Must be implemented by concrete gizmo classes
   */
  abstract isSetup: boolean;

  /**
   * Sets up the entities and components required for the gizmo
   * This method is called internally and should only be executed once
   * @internal
   */
  abstract _setup(): void;

  /**
   * Updates the gizmo's transform, appearance, and other properties
   * This method is typically called every frame to keep the gizmo synchronized
   * with its target entity
   * @internal
   */
  abstract _update(): void;

  /**
   * Cleans up and destroys the gizmo, releasing all associated resources
   * @internal
   */
  abstract _destroy(): void;

  /**
   * Deletes the top entity of this gizmo from the scene and the EntityRepository, and clears
   * this gizmo's reference to it.
   *
   * `Entity._destroy()` alone leaves the entity registered in the repository, where it is still
   * returned by tag searches such as `searchByTags({ Being: 'gizmo' })`. The editor collects the
   * gizmo entities that way, so a destroyed but still registered gizmo would be added to the gizmo
   * render pass again on the next rebuild. Deleting the entity from the repository also detaches
   * it from the target's gizmo children and releases its GPU resources.
   *
   * @internal
   */
  protected __destroyTopEntity(): void {
    const topEntity = this.__topEntity;
    this.__topEntity = undefined;
    if (topEntity == null) {
      return;
    }
    // The entity can already be gone when every entity of the engine is being deleted.
    if (this.__engine.entityRepository.getEntity(topEntity.entityUID) != null) {
      this.__engine.entityRepository.deleteEntityRecursively(topEntity.entityUID);
    }
  }

  /**
   * Determines whether the gizmo setup should be skipped
   * @returns True if setup should be skipped, false otherwise
   */
  protected __toSkipSetup(): boolean {
    if (this.isSetup) {
      return true;
    }
    if (this.__target.matchTag('Being', 'gizmo')) {
      return true;
    }
    return false;
  }

  /**
   * Applies appropriate tags to the gizmo entities for identification and categorization
   * This method ensures that all gizmo entities are properly tagged for rendering
   * and processing pipelines
   */
  protected setGizmoTag() {
    if (this.__topEntity) {
      this.__topEntity.tryToSetTag({ tag: 'Being', value: 'gizmo' });

      const sceneGraphs = flattenHierarchy(this.__topEntity.getSceneGraph()!, false);
      for (const sg of sceneGraphs) {
        sg.entity.tryToSetTag({ tag: 'Being', value: 'gizmo' });
      }

      this.__topEntity.tryToSetTag({
        tag: 'type',
        value: 'background-assets',
      });
    }
  }

  /**
   * Marks the gizmo subtree's world matrices as dirty and materializes them immediately.
   *
   * The GPU instance data (world and normal matrices) is uploaded at the beginning of the Render
   * stage from component buffers, and those buffers are only written when the matrices are
   * recalculated. A gizmo updated after the Logic stage (for example when only the camera
   * changed) therefore has to recalculate its matrices here, otherwise the gizmo keeps being
   * rendered with its previous transform until some later frame re-uploads the data.
   * @internal
   */
  protected __updateWorldMatricesOfSubtree(): void {
    const topSceneGraph = this.__topEntity?.getSceneGraph();
    if (topSceneGraph == null) {
      return;
    }
    topSceneGraph.setWorldMatrixDirtyWithoutAABBDirty();
    const stack: SceneGraphComponent[] = [topSceneGraph];
    while (stack.length > 0) {
      const sceneGraph = stack.pop()!;
      // Reading the accessors recalculates the matrices and writes them into the GPU buffers.
      sceneGraph.matrixInner;
      if (sceneGraph.entity.tryToGetMesh() != null) {
        sceneGraph.normalMatrixInner;
      }
      for (const child of sceneGraph.children) {
        stack.push(child);
      }
    }
  }

  /**
   * Calculates a uniform world-space scale that keeps a unit-length gizmo element
   * (an axis of length 1, or a ring of radius 1) at a constant fraction of the
   * viewport height, independent of the target size and the camera distance.
   *
   * The scale is derived from the vertical scale of the camera's projection matrix,
   * so the on-screen size stays proportional to the viewport height for both
   * perspective and orthographic cameras.
   *
   * @param engine - The engine used to resolve the current camera
   * @param worldPosition - The world-space position of the gizmo center
   * @param screenSpaceRatio - The target size as a fraction of the viewport height
   * @returns The uniform scale to apply to the gizmo's top entity
   * @internal
   */
  protected static __calcScreenSpaceScale(engine: Engine, worldPosition: IVector3, screenSpaceRatio: number): number {
    if (!Number.isFinite(screenSpaceRatio) || screenSpaceRatio <= 0) {
      return 1;
    }

    const cameraComponent = engine.componentRepository.getComponent(
      CameraComponent,
      CameraComponent.getCurrent(engine)
    ) as CameraComponent | undefined;
    if (cameraComponent == null) {
      return 1;
    }

    // The vertical NDC scale of the projection matrix:
    // perspective: m11 = 1 / tan(fovy / 2), orthographic: m11 = 1 / yMag.
    const verticalScale = cameraComponent.projectionMatrix.m11;
    if (!Number.isFinite(verticalScale) || verticalScale <= 0) {
      return 1;
    }

    if (cameraComponent.type === CameraType.Orthographic) {
      const orthographicScale = (screenSpaceRatio * 2) / verticalScale;
      return Number.isFinite(orthographicScale) && orthographicScale > 0 ? orthographicScale : 1;
    }

    // Use the view-space depth (not the Euclidean distance) so that the gizmo keeps
    // the same on-screen size even when it is displayed near the edge of the viewport.
    cameraComponent.viewMatrix.multiplyVector3To(worldPosition, Gizmo.__tmpViewPosition);
    const viewDepth = -Gizmo.__tmpViewPosition.z;
    const zNear = cameraComponent.zNearInner;
    const nearLimit = Number.isFinite(zNear) && zNear > 0 ? zNear : 1e-4;
    const depth = Number.isFinite(viewDepth) ? Math.max(viewDepth, nearLimit) : nearLimit;

    const scale = (screenSpaceRatio * 2 * depth) / verticalScale;
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }
}
