import Vector3 from "../math/Vector3";
import TransformComponent from "../components/TransformComponent";
import MutableVector3 from "../math/MutableVector3";
import SceneGraphComponent from "../components/SceneGraphComponent";
import Quaternion from "../math/Quaternion";
import { thisExpression } from "@babel/types";
import SphereCollider from "./SphereCollider";
import Matrix44 from "../math/Matrix44";
import PhysicsComponent from "../components/PhysicsComponent";
import Time from "../misc/Time";
import Entity from "../core/Entity";

export default class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __stiffnessForce = 1.0;
  private static __gravityPower = 0;
  private static __gravityDir = new Vector3(0, -1.0, 0);
  private static __dragForce = 0.4;
  private static __hitRadius = 0.02;
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();
  private static __rootBones: SceneGraphComponent[] = [];
  // private static __verlet: VRMSpringBonePhysicsStrategy[] = [];

  private __parent?: SceneGraphComponent;
  private __boneAxis = Vector3.zero();
  private __length = 0;
  private __currentTail = Vector3.zero();
  private __prevTail = Vector3.zero();
  private __localDir = Vector3.zero();
  private __localRotation = new Quaternion(0, 0, 0, 1);
  private __radius = 0;

  constructor() {
  }

  initialize(parent: SceneGraphComponent, localChildPosition: Vector3, center?: SceneGraphComponent) {
    this.__parent = parent;
    const worldChildPosition = parent.getWorldPositionOf(localChildPosition);
    this.__currentTail = (center != null) ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
    this.__prevTail = this.__currentTail;
    this.__localRotation = parent.entity.getTransform().quaternion;
    this.__boneAxis = Vector3.normalize(localChildPosition);
    this.__length = localChildPosition.length();
  }

  get head(): SceneGraphComponent {
    return this.__parent!;
  }

  get tail(): Vector3 {
    Vector3.multiplyTo(this.__boneAxis, this.__length, VRMSpringBonePhysicsStrategy.__tmp_vec3);
    this.__parent!.worldMatrixInner.multiplyVector3To(VRMSpringBonePhysicsStrategy.__tmp_vec3, VRMSpringBonePhysicsStrategy.__tmp_vec3_2);

    return VRMSpringBonePhysicsStrategy.__tmp_vec3_2;
  }

  get parentRotation() {
    return (this.__parent!.parent != null) ? Quaternion.fromMatrix(this.__parent!.parent.worldMatrix) : new Quaternion(0, 0, 0, 1);
  }

  static initialize() {
  }


  static update() {
    this.updateInner(this.__rootBones);
  }

  static updateInner(sceneGraphs: SceneGraphComponent[]) {
    const dragForce = VRMSpringBonePhysicsStrategy.__dragForce;
    const stiffnessForce = VRMSpringBonePhysicsStrategy.__stiffnessForce * Time.lastTickTimeInterval;
    const external = Vector3.multiply(VRMSpringBonePhysicsStrategy.__gravityDir, VRMSpringBonePhysicsStrategy.__gravityPower * Time.lastTickTimeInterval);
    const colliders: SphereCollider[] = [];
    let center: SceneGraphComponent|undefined = void 0;

    for (let rootBone of sceneGraphs) {
      const physicsComponent = rootBone.entity.getPhysics();
      if (physicsComponent) {
        const strategy = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
        strategy.update(stiffnessForce, dragForce, external, colliders, center);
        const children = rootBone.children;
        if (children) {
          this.updateInner(children);
        }
      }
    }
  }

  update(stiffnessForce: number, dragForce: number, external: Vector3, colliders: SphereCollider[], center?: SceneGraphComponent) {

    const currentTail = (center != null) ? center!.getWorldPositionOf(this.__currentTail) : this.__currentTail;
    const prevTail = (center != null) ? center!.getWorldPositionOf(this.__prevTail) : this.__prevTail;

    const delta = MutableVector3.multiply(Vector3.subtract(currentTail, prevTail), 1.0 - dragForce);
    const dist = (new Matrix44(Quaternion.multiply(this.parentRotation, this.__localRotation))).multiplyVector(Vector3.multiply(this.__boneAxis, stiffnessForce));
    let nextTail = Vector3.add(Vector3.add(Vector3.add(currentTail, delta), (dist as any as Vector3)), external);

    const tmp = Vector3.subtract(nextTail, this.__parent!.worldPosition);
    nextTail = Vector3.add(this.__parent!.worldPosition, Vector3.multiply(Vector3.normalize(tmp), this.__length));

    nextTail = this.collision(colliders, nextTail);

    this.__prevTail = (center != null) ? center!.getLocalPositionOf(currentTail) : currentTail;
    this.__currentTail = (center != null) ? center!.getLocalPositionOf(nextTail) : nextTail;

    this.head.entity.getTransform().quaternion = this.applyRotation(nextTail);
  }

  applyRotation(nextTail: Vector3) {
    var rotation = Quaternion.multiply(this.parentRotation, this.__localRotation);
    return Quaternion.multiply(Quaternion.lookFromTo(rotation.multiplyVector3(this.__boneAxis), Vector3.subtract(nextTail, this.__parent!.worldPosition)), rotation);
  }

  collision(colliders: SphereCollider[], nextTail: Vector3) {
    for (let collider of colliders) {
      const r = this.__radius + collider.radius;
      if (Vector3.lengthSquared(Vector3.subtract(nextTail, collider.position)) <= (r * r)) {
        var normal = Vector3.subtract(nextTail, collider.position).normalize();
        var posFromCollider = Vector3.multiply(Vector3.add(collider.position, normal), this.__radius + collider.radius);
        nextTail = Vector3.add(this.__parent!.worldPosition, Vector3.multiply(Vector3.subtract(posFromCollider, this.__parent!.worldPosition).normalize(), this.__length));
      }
    }

    return nextTail;
  }

  static addRootBone(sg: SceneGraphComponent) {
    this.__rootBones.push(sg);
  }
}
