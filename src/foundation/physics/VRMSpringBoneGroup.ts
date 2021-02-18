import Vector3 from '../math/Vector3';
import SceneGraphComponent from '../components/SceneGraphComponent';
import RnObject from '../core/RnObject';
import { Index } from '../../commontypes/CommonTypes';

export default class VRMSpringBoneGroup extends RnObject {
  stiffnessForce = 0.5;
  gravityPower = 0;
  gravityDir = new Vector3(0, -1.0, 0);
  dragForce = 0.05;
  hitRadius = 0.02;
  rootBones: SceneGraphComponent[] = [];
  colliderGroupIndices: Index[] = [];

  constructor() {
    super()
  }
}
