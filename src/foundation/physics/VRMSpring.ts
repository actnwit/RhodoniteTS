import { Vector3 } from '../math/Vector3';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../core/RnObject';
import { Index } from '../../types/CommonTypes';
import { VRMSpringBone } from './VRMSpringBone';

export class VRMSpring extends RnObject {
  // stiffnessForce = 0.5;
  // gravityPower = 0;
  // gravityDir = Vector3.fromCopyArray([0, -1.0, 0]);
  // dragForce = 0.05;
  // hitRadius = 0.02;
  rootBone: SceneGraphComponent;
  bones: VRMSpringBone[] = [];
  colliderGroupIndices: Index[] = [];

  constructor(rootBone: SceneGraphComponent) {
    super();
    this.rootBone = rootBone;
  }
}
