import { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';

export class SphereCollider {
  public position = Vector3.zero();
  public radius = 0;
  baseSceneGraph?: SceneGraphComponent;

  private static __tmp_vec3_0 = MutableVector3.zero();
  private static __tmp_vec3_1 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();

  collision(bonePosition: Vector3, boneRadius: number) {
    const spherePosWorld = this.baseSceneGraph!.getWorldPositionOfTo(
      this.position,
      SphereCollider.__tmp_vec3_0
    );
    const delta = Vector3.subtractTo(bonePosition, spherePosWorld, SphereCollider.__tmp_vec3_1);
    const direction = Vector3.normalizeTo(delta, SphereCollider.__tmp_vec3_2);
    const radius = this.radius + boneRadius;
    const distance = delta.length() - radius;

    return { direction, distance };
  }
}
