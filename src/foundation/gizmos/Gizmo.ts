import RnObject from "../core/RnObject";
import SceneGraphComponent from "../components/SceneGraphComponent";
import EntityRepository from "../core/EntityRepository";
import Entity from "../core/Entity";

export default abstract class Gizmo extends RnObject {
  protected __entityRepository = EntityRepository.getInstance();
  protected __topEntity?: Entity;
  protected __substance: RnObject;
  constructor(substance: RnObject) {
    super();
    this.__substance = substance;
    this.setup();
    this.setGizmoTag();
  }

  abstract setup(): void;

  abstract update(): void;

  private setGizmoTag() {
    if (this.__topEntity) {
      const sceneGraphs = SceneGraphComponent.flattenHierarchy(this.__topEntity.getSceneGraph(), false);
      for (let sg of sceneGraphs) {
        sg.entity.tryToSetTag({tag: 'Being', value: 'gizmo'});
      }
    }
  }
}
