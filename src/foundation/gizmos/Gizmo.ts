import RnObject from '../core/RnObject';
import SceneGraphComponent from '../components/SceneGraphComponent';
import EntityRepository from '../core/EntityRepository';
import Entity from '../core/Entity';

export default abstract class Gizmo extends RnObject {
  protected __entityRepository = EntityRepository.getInstance();
  protected __topEntity?: Entity;
  protected __substance: RnObject;
  protected __isVisible = false;

  constructor(substance: RnObject) {
    super();
    this.__substance = substance;
    this.setGizmoTag();
  }

  abstract setup(): void;

  abstract isSetup: boolean;

  abstract update(): void;

  protected setGizmoTag() {
    if (this.__topEntity) {
      const sceneGraphs = SceneGraphComponent.flattenHierarchy(
        this.__topEntity.getSceneGraph(),
        false
      );
      for (const sg of sceneGraphs) {
        sg.entity.tryToSetTag({tag: 'Being', value: 'gizmo'});
      }
    }
  }

  set isVisible(flg: boolean) {
    this.__isVisible = flg;
    if (this.__topEntity) {
      this.__topEntity.getSceneGraph().setVisibilityRecursively(flg);
    }
  }

  get isVisible() {
    return this.__isVisible;
  }
}
