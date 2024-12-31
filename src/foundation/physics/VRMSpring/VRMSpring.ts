import { Vector3 } from '../../math/Vector3';
import { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../../core/RnObject';
import { Index } from '../../../types/CommonTypes';
import { VRMSpringBone } from './VRMSpringBone';
import { VRMColliderGroup } from './VRMColliderGroup';

export class VRMSpring extends RnObject {
  rootBone: SceneGraphComponent;
  bones: VRMSpringBone[] = [];
  colliderGroups: VRMColliderGroup[] = [];
  center: SceneGraphComponent | undefined;

  constructor(rootBone: SceneGraphComponent) {
    super();
    this.rootBone = rootBone;
  }
}
