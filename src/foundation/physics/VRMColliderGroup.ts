import { SphereCollider } from './SphereCollider';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { CapsuleCollider } from './CapsuleCollider';

export class VRMColliderGroup {
  sphereColliders: SphereCollider[] = [];
  capsuleColliders: CapsuleCollider[] = [];
  baseSceneGraph?: SceneGraphComponent;
}
