import { Vector3 } from '../math/Vector3';
import { MutableVector3 } from '../math/MutableVector3';
import { SceneGraphComponent } from '../components/SceneGraph/SceneGraphComponent';
import { Quaternion } from '../math/Quaternion';
import { Matrix44 } from '../math/Matrix44';
import { Time } from '../misc/Time';
import { VRMSpringBoneGroup } from './VRMSpringBoneGroup';
import { VRMColliderGroup } from './VRMColliderGroup';
import { Index } from '../../types/CommonTypes';
import { PhysicsStrategy } from './PhysicsStrategy';
import { MutableQuaternion } from '../math/MutableQuaternion';
import { IQuaternion } from '../math';

export class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
  private static __tmp_vec3 = MutableVector3.zero();
  private static __tmp_vec3_2 = MutableVector3.zero();
  private static __tmp_quat = MutableQuaternion.identity();
  private static __boneGroups: VRMSpringBoneGroup[] = [];
  private static __colliderGroups: Map<Index, VRMColliderGroup> = new Map();

  // for bone
  private __transform?: SceneGraphComponent;
  private __boneAxis = Vector3.zero();
  private __length = 0;
  private __currentTail = Vector3.zero();
  private __prevTail = Vector3.zero();
  private __localRotation = Quaternion.fromCopy4(0, 0, 0, 1) as IQuaternion;
  private __initalized = false;

  constructor() {}

  initialize(
    transform: SceneGraphComponent,
    localChildPosition: Vector3,
    center?: SceneGraphComponent
  ) {
    this.__transform = transform;
    const worldChildPosition = transform.getWorldPositionOf(localChildPosition);
    this.__currentTail =
      center != null ? center.getLocalPositionOf(worldChildPosition) : worldChildPosition;
    this.__prevTail = this.__currentTail;
    this.__localRotation = transform.entity.getTransform()!.localRotation;
    this.__boneAxis = Vector3.normalize(localChildPosition);
    this.__length = localChildPosition.length();

    this.__initalized = true;
  }

  get isInitialized() {
    return this.__initalized;
  }

  get head(): SceneGraphComponent {
    return this.__transform!;
  }

  get tail(): Vector3 {
    Vector3.multiplyTo(this.__boneAxis, this.__length, VRMSpringBonePhysicsStrategy.__tmp_vec3);
    this.__transform!.matrixInner.multiplyVector3To(
      VRMSpringBonePhysicsStrategy.__tmp_vec3,
      VRMSpringBonePhysicsStrategy.__tmp_vec3_2
    );

    return VRMSpringBonePhysicsStrategy.__tmp_vec3_2;
  }

  get parentRotation() {
    // return (this.__transform!.parent != null) ? this.__transform!.parent!.entity.getTransform().quaternion : new Quaternion(0, 0, 0, 1);
    return this.__transform!.parent != null
      ? Quaternion.fromMatrix(this.__transform!.parent!.matrixInner)
      : Quaternion.fromCopy4(0, 0, 0, 1);
  }

  static update() {
    for (const boneGroup of this.__boneGroups) {
      this.updateInner(boneGroup.rootBones, boneGroup);
    }
  }

  static updateInner(sceneGraphs: SceneGraphComponent[], boneGroup: VRMSpringBoneGroup) {
    const dragForce = boneGroup.dragForce;
    const stiffnessForce = boneGroup.stiffnessForce * Time.lastTickTimeInterval * 1;
    const external = Vector3.multiply(
      boneGroup.gravityDir,
      boneGroup.gravityPower * Time.lastTickTimeInterval * 1
    );
    const center: SceneGraphComponent | undefined = void 0;

    const collisionGroups = VRMSpringBonePhysicsStrategy.getColliderGroups(
      boneGroup.colliderGroupIndices
    );

    for (const sg of sceneGraphs) {
      const physicsComponent = sg.entity.tryToGetPhysics();
      if (physicsComponent) {
        const strategy = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
        strategy.update(
          stiffnessForce,
          dragForce,
          external,
          collisionGroups,
          boneGroup.hitRadius,
          center
        );
        const children = sg.children;
        if (children) {
          this.updateInner(children, boneGroup);
        }
      }
    }
  }

  static initialize(sceneGraph: SceneGraphComponent) {
    const children = sceneGraph.children;

    const physicsComponent = sceneGraph.entity.tryToGetPhysics()!;
    const vrmSpringBone = physicsComponent.strategy as VRMSpringBonePhysicsStrategy;
    if (children.length > 0) {
      const transform = children[0].entity.getTransform();
      // const childPositionInLocal = Matrix44.invert(
      //   sceneGraph.worldMatrixInner
      // ).multiplyVector3(children[0].worldPosition);
      vrmSpringBone.initialize(
        sceneGraph,
        Vector3.fromCopy3(
          transform.localPosition.x * transform.localScale.x,
          transform.localPosition.y * transform.localScale.y,
          transform.localPosition.z * transform.localScale.z
        ),
        // childPositionInLocal,
        void 0
      );
    } else {
      const delta = Vector3.subtract(sceneGraph.worldPosition, sceneGraph.parent!.worldPosition);
      let childPosition = Vector3.fromCopyArray([1, 1, 1]);
      if (delta.lengthSquared() > 0) {
        childPosition = Vector3.add(
          sceneGraph.worldPosition,
          Vector3.multiply(Vector3.normalize(delta), 0.07)
        );
      }
      const childPositionInLocal = sceneGraph.getLocalPositionOf(childPosition);
      vrmSpringBone.initialize(sceneGraph, childPositionInLocal, void 0);
    }
  }

  calcParentDeltaRecursivle(sceneGraph: SceneGraphComponent) {
    const delta = Vector3.subtract(sceneGraph.worldPosition, sceneGraph.parent!.worldPosition);
  }

  update(
    stiffnessForce: number,
    dragForce: number,
    external: Vector3,
    collisionGroups: VRMColliderGroup[],
    boneHitRadius: number,
    center?: SceneGraphComponent
  ) {
    const currentTail =
      center != null ? center.getWorldPositionOf(this.__currentTail) : this.__currentTail;
    const prevTail = center != null ? center.getWorldPositionOf(this.__prevTail) : this.__prevTail;

    // Continues the previous frame's movement (there is also attenuation)
    const delta = MutableVector3.multiply(Vector3.subtract(currentTail, prevTail), 1.0 - dragForce);

    // Movement target of child bones due to parent's rotation
    const rotation = Quaternion.multiply(this.parentRotation, this.__localRotation);
    const childBoneTarget = Vector3.multiply(
      rotation.transformVector3(this.__boneAxis),
      stiffnessForce
    );

    // Calculate the nextTail
    let nextTail = Vector3.add(
      Vector3.add(Vector3.add(currentTail, delta), childBoneTarget),
      external
    );

    // Normalize to bone length
    const sub = Vector3.normalize(Vector3.subtract(nextTail, this.head.worldPosition));
    nextTail = Vector3.add(this.head!.worldPosition, Vector3.multiply(sub, this.__length));

    // Movement by Collision
    nextTail = this.collision(collisionGroups, nextTail, boneHitRadius);

    // prevTail = currentTail;
    // currentTail = nextTail;
    this.__prevTail = center != null ? center.getLocalPositionOf(currentTail) : currentTail;
    this.__currentTail = center != null ? center.getLocalPositionOf(nextTail) : nextTail;

    const resultRotation = this.applyRotation(nextTail);
    if (this.head.children.length > 0) {
      this.head.children[0].entity.getTransform().localRotation = resultRotation;
    }
  }

  applyRotation(nextTail: Vector3) {
    const result = Quaternion.fromToRotation(
      Vector3.normalize(this.__boneAxis),
      Vector3.normalize(this.head.getLocalPositionOf(nextTail))
    );
    return result;
  }

  collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number) {
    for (const collisionGroup of collisionGroups) {
      for (const collider of collisionGroup.colliders) {
        const worldColliderPos = collisionGroup.baseSceneGraph!.getWorldPositionOf(
          collider.position
        );
        const r = boneHitRadius + collider.radius;
        const delta = Vector3.subtract(nextTail, worldColliderPos);
        const deltaScalar = r - delta.length();
        if (deltaScalar >= 0) {
          const normal = Vector3.normalize(delta);
          const resilienceVec = Vector3.multiply(
            Vector3.add(worldColliderPos, normal),
            deltaScalar
          );
          nextTail = Vector3.add(nextTail, resilienceVec);
          return nextTail;
        }
      }
    }

    return nextTail;
  }

  static setBoneGroups(sgs: VRMSpringBoneGroup[]) {
    this.__boneGroups = sgs;
  }

  static addColliderGroup(index: Index, group: VRMColliderGroup) {
    this.__colliderGroups.set(index, group);
  }

  static getColliderGroups(indices: Index[]) {
    const colliderGroups: VRMColliderGroup[] = [];
    for (const index of indices) {
      colliderGroups.push(this.__colliderGroups.get(index)!);
    }
    return colliderGroups;
  }
}
