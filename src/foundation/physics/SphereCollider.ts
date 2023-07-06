import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Vector3 } from '../math/Vector3';

export class SphereCollider {
  public position = Vector3.zero();
  public radius = 0;
  baseSceneGraph?: SceneGraphComponent;

  collision(bonePosition: Vector3, boneRadius: number) {
    const spherePosWorld = this.baseSceneGraph!.getWorldPositionOf(this.position);
    const delta = Vector3.subtract(bonePosition, spherePosWorld);
    const direction = Vector3.normalize(delta);
    const radius = this.radius + boneRadius;
    const distance = delta.length() - radius;

    return { direction, distance };
  }
}
