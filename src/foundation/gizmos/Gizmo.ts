import { RnObject } from '../core/RnObject';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import {ISceneGraphEntity, IMeshEntity} from '../helpers/EntityHelper';

/**
 * Abstract Gizmo class
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

  /**
   * Constructor
   * @param entity the object which this gizmo belong to
   */
  constructor(target: ISceneGraphEntity) {
    super();
    this.__target = target;
    this.setGizmoTag();
  }

  ///
  ///
  /// Accessors
  ///
  ///

  set isVisible(flg: boolean) {
    this.__setVisible(flg);
  }

  get isVisible() {
    return this.__isVisible;
  }

  protected __setVisible(flg: boolean) {
    this.__isVisible = flg;
    if (this.__topEntity) {
      this.__topEntity.getSceneGraph()!.setVisibilityRecursively(flg);
    }
  }

  abstract isSetup: boolean;

  /**
   * @private
   * setup entities of Gizmo if not done yet
   */
  abstract _setup(): void;

  /**
   * @private
   * update the transform and etc of the gizmo
   */
  abstract _update(): void;

  protected __toSkipSetup(): boolean {
    if (this.isSetup) {
      return true;
    }
    if (this.__target.matchTag('Being', 'gizmo')) {
      return true;
    }
    return false;
  }

  protected setGizmoTag() {
    if (this.__topEntity) {
      this.__topEntity.tryToSetTag({tag: 'Being', value: 'gizmo'});
      this.__topEntity.tryToSetTag({tag: 'Gizmo', value: 'top'});

      const sceneGraphs = SceneGraphComponent.flattenHierarchy(
        this.__topEntity.getSceneGraph()!,
        false
      );
      for (const sg of sceneGraphs) {
        sg.entity.tryToSetTag({tag: 'Being', value: 'gizmo'});
      }

      this.__topEntity.tryToSetTag({
        tag: 'type',
        value: 'background-assets',
      });
    }
  }
}
