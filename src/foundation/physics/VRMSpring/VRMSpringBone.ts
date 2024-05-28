import { SceneGraphComponent } from '../../components';
import { RnObject } from '../../core/RnObject';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IVector3, Matrix44, MutableVector3, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';

export class VRMSpringBone extends RnObject {
  stiffnessForce = 0.5;
  gravityPower = 0;
  gravityDir = Vector3.fromCopyArray([0, -1.0, 0]);
  dragForce = 0.05;
  hitRadius = 0.02;
  node: ISceneGraphEntity;

  currentTail: Vector3 = Vector3.zero(); // In World Space
  prevTail: Vector3 = Vector3.zero(); // In World Space
  boneAxis: Vector3 = Vector3.zero(); // In Local Space
  boneLength = 0;

  initialized = false;

  private static __tmp_vec3_0 = MutableVector3.zero();

  constructor(node: ISceneGraphEntity) {
    super();
    this.node = node;
  }

  setup(localChildPosition: IVector3, center?: SceneGraphComponent) {
    if (!this.initialized) {
      const scenegraph = this.node.getSceneGraph();
      this.node.getTransform()._backupTransformAsRest();
      const worldChildPosition = scenegraph.getWorldPositionOfTo(
        localChildPosition,
        VRMSpringBone.__tmp_vec3_0
      );
      this.currentTail =
        center != null ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
      this.prevTail = this.currentTail.clone();
      this.boneAxis = Vector3.normalize(localChildPosition);
      this.boneLength = localChildPosition.length();
      this.initialized = true;
    }
  }
}
