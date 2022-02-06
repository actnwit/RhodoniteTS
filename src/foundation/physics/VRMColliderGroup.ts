import SphereCollider from './SphereCollider';
import SceneGraphComponent from '../components/SceneGraph/SceneGraphComponent';

export default class VRMColliderGroup {
  colliders: SphereCollider[] = [];
  baseSceneGraph?: SceneGraphComponent;
}
