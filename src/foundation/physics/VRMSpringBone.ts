import { SceneGraphComponent } from "../components";
import { RnObject } from "../core/RnObject";
import { ISceneGraphEntity } from "../helpers/EntityHelper";
import { IVector3, Quaternion } from "../math";
import { Vector3 } from "../math/Vector3";

export class VRMSpringBone extends RnObject {
  stiffnessForce = 0.5;
  gravityPower = 0;
  gravityDir = Vector3.fromCopyArray([0, -1.0, 0]);
  dragForce = 0.05;
  hitRadius = 0.02;
  node: ISceneGraphEntity

  currentTail: Vector3 = Vector3.zero();
  prevTail: Vector3 = Vector3.zero();
  boneAxis: Vector3 = Vector3.zero();
  boneLength = 0;
  localRotation = Quaternion.identity();

  constructor(node: ISceneGraphEntity) {
    super();
    this.node = node;
  }

  setup(localChildPosition: IVector3, center?: SceneGraphComponent) {
    const scenegraph = this.node.getSceneGraph();
    const worldChildPosition = scenegraph.getWorldPositionOf(localChildPosition);
    this.currentTail = center != null ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
    this.prevTail = this.currentTail;
    this.localRotation = scenegraph.entity.getTransform().localRotation as Quaternion;
    this.boneAxis = Vector3.normalize(localChildPosition);
    this.boneLength = localChildPosition.length();
  }
}
