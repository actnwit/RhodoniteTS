import Vector3 from "../math/Vector3";
import TransformComponent from "../components/TransformComponent";
import MutableVector3 from "../math/MutableVector3";
import SceneGraphComponent from "../components/SceneGraphComponent";

export default class VRMSpringBonePhysicsStrategy {
  private static __stiffnessForce = 1.0;
  private static __gravityPower = 0;
  private static __gravityDir = new Vector3(0, -1.0, 0);
  private static __dragForce = 0.4;
  private static __hitRadius = 0.02;
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();

  private __parent: SceneGraphComponent;
  private __boneAxis = Vector3.zero();
  private __length = 0;
  private __currentTail = Vector3.zero();

  constructor(center: SceneGraphComponent, parent: SceneGraphComponent, localChildPosition: Vector3) {
    this.__parent = parent;
    const worldChildPosition = parent.getWorldPositionOf(localChildPosition);

  }

  get head(): SceneGraphComponent {
    return this.__parent;
  }

  get tail(): Vector3 {
    Vector3.multiplyTo(this.__boneAxis, this.__length, VRMSpringBonePhysicsStrategy.__tmp_vec3);
    this.__parent.worldMatrixInner.multiplyVector3To(VRMSpringBonePhysicsStrategy.__tmp_vec3, VRMSpringBonePhysicsStrategy.__tmp_vec3_2);

    return VRMSpringBonePhysicsStrategy.__tmp_vec3_2;
  }

}
