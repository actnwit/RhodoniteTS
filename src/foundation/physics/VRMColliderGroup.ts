import { SphereCollider } from './SphereCollider';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';

export class VRMColliderGroup {
  colliders: SphereCollider[] = [];
  baseSceneGraph?: SceneGraphComponent;
}
