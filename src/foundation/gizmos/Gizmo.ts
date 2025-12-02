import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { flattenHierarchy } from '../components/SceneGraph/SceneGraphOps';
import { RnObject } from '../core/RnObject';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Engine } from '../system/Engine';

/**
 * Abstract Gizmo class that provides a foundation for creating interactive gizmo objects
 * in 3D scenes. Gizmos are typically used for manipulation tools like transform handles,
 * rotation rings, or other interactive visual aids.
 */
export abstract class Gizmo extends RnObject {
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
}
