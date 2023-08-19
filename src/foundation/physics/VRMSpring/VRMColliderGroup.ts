import { SphereCollider } from './SphereCollider';
import { CapsuleCollider } from './CapsuleCollider';

export class VRMColliderGroup {
  sphereColliders: SphereCollider[] = [];
  capsuleColliders: CapsuleCollider[] = [];
}
