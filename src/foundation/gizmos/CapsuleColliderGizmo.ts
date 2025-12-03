import { createGroupEntity } from '../components/SceneGraph/createGroupEntity';
import type { IMeshEntity, ISceneGraphEntity } from '../helpers/EntityHelper';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { MeshHelper } from '../helpers/MeshHelper';
import { MutableQuaternion } from '../math/MutableQuaternion';
import { MutableVector3 } from '../math/MutableVector3';
import { Vector3 } from '../math/Vector3';
import { Vector4 } from '../math/Vector4';
import { Is } from '../misc/Is';
import type { CapsuleCollider } from '../physics/VRMSpring/CapsuleCollider';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';

/**
 * CapsuleColliderGizmo renders a capsule collider visualization for debugging purposes.
 * The visualization is a semi-transparent green wireframe capsule that shows the collider's bounds.
 */
export class CapsuleColliderGizmo extends Gizmo {
  protected declare __topEntity?: ISceneGraphEntity;

  private __capsuleCollider: CapsuleCollider;
  private __capsuleEntity?: IMeshEntity;

  // Reusable temporary vectors for calculations
  private static __tmpVec3_0 = MutableVector3.zero();
  private static __tmpVec3_1 = MutableVector3.zero();
  private static __tmpQuat = MutableQuaternion.identity();

  /**
   * Creates a new CapsuleColliderGizmo instance
   * @param capsuleCollider - The capsule collider to visualize
   */
  constructor(engine: Engine, capsuleCollider: CapsuleCollider) {
    super(engine, capsuleCollider.baseSceneGraph.entity as ISceneGraphEntity);
    this.__capsuleCollider = capsuleCollider;
  }

  get isSetup(): boolean {
    return Is.exist(this.__topEntity);
  }

  _setup(): void {
    if (this.__toSkipSetup()) {
      return;
    }

    const targetSceneGraph = this.__target.getSceneGraph();
    if (!targetSceneGraph) {
      return;
    }

    this.__topEntity = createGroupEntity(this.__engine);
    this.__topEntity.tryToSetUniqueName(`CapsuleColliderGizmo_of_${this.__target.uniqueName}`, true);
    this.__topEntity.getSceneGraph()!.toMakeWorldMatrixTheSameAsLocalMatrix = true;
    targetSceneGraph._addGizmoChild(this.__topEntity.getSceneGraph()!);

    // Calculate capsule height from head and tail positions
    const headPos = this.__capsuleCollider.position;
    const tailPos = this.__capsuleCollider.tail;
    const height = Vector3.subtract(tailPos, headPos).length();

    // Create a capsule mesh with the same dimensions as the collider
    const material = MaterialHelper.createPbrUberMaterial(this.__engine, {
      isLighting: false,
      isSkinning: false,
      isMorphing: false,
      maxInstancesNumber: 1,
    });
    material.addShaderDefine('RN_USE_WIREFRAME');
    material.setParameter('wireframe', Vector3.fromCopy3(1, 0, 1));
    // Set semi-transparent green color
    material.setParameter('baseColorFactor', Vector4.fromCopy4(0.0, 1.0, 0.0, 1.0));

    const capsuleEntity = MeshHelper.createCapsule(this.__engine, {
      radius: this.__capsuleCollider.radius,
      height: height,
      widthSegments: 16,
      heightSegments: 8,
      material: material,
    });

    // Set up the wireframe visualization
    const meshComponent = capsuleEntity.getMesh();
    meshComponent.calcBaryCentricCoord();

    // Set 'Gizmo: CapsuleCollider' tag to prevent being added to BasicGizmos RenderPass
    // (which would cause double rendering with JointAndColliderGizmos RenderPass)
    capsuleEntity.tryToSetTag({ tag: 'Gizmo', value: 'CapsuleCollider' });

    // Add as a child of the top entity
    this.__topEntity.getSceneGraph()!.addChild(capsuleEntity.getSceneGraph());

    this.__capsuleEntity = capsuleEntity;

    this.setGizmoTag();
    this.__topEntity.tryToSetTag({ tag: 'Gizmo', value: 'CapsuleCollider' });

    // Initial update to position the gizmo correctly
    this._update();
  }

  _update(): void {
    if (!Is.exist(this.__topEntity) || !Is.exist(this.__capsuleEntity)) {
      return;
    }

    // Get world positions of head and tail
    const worldMatrix = this.__capsuleCollider.baseSceneGraph.matrixInner;
    const headPos = this.__capsuleCollider.position;
    const tailPos = this.__capsuleCollider.tail;

    // Transform head and tail to world space
    const worldHead = CapsuleColliderGizmo.__tmpVec3_0;
    const worldTail = CapsuleColliderGizmo.__tmpVec3_1;
    worldMatrix.multiplyVector3To(headPos, worldHead);
    worldMatrix.multiplyVector3To(tailPos, worldTail);

    // Calculate center position (midpoint between head and tail)
    const centerX = (worldHead.x + worldTail.x) / 2;
    const centerY = (worldHead.y + worldTail.y) / 2;
    const centerZ = (worldHead.z + worldTail.z) / 2;

    // Set the capsule position to the center
    this.__capsuleEntity.localPosition = Vector3.fromCopy3(centerX, centerY, centerZ);

    // Calculate the direction from head to tail
    const direction = Vector3.subtract(worldTail, worldHead);
    const length = direction.length();

    if (length > 0.0001) {
      // Normalize the direction
      const normalizedDir = Vector3.normalize(direction);

      // The capsule is generated along the Y axis, so we need to calculate
      // the rotation from Y-axis (0, 1, 0) to the direction vector
      const yAxis = Vector3.fromCopy3(0, 1, 0);
      const rotationQuat = CapsuleColliderGizmo.__tmpQuat;

      // Calculate rotation quaternion from Y-axis to direction
      const dot = yAxis.dot(normalizedDir);

      if (dot > 0.9999) {
        // Vectors are nearly parallel, no rotation needed
        rotationQuat.setComponents(0, 0, 0, 1);
      } else if (dot < -0.9999) {
        // Vectors are nearly opposite, rotate 180 degrees around X or Z axis
        rotationQuat.setComponents(1, 0, 0, 0);
      } else {
        // Calculate rotation axis (cross product)
        const axis = Vector3.cross(yAxis, normalizedDir);
        const axisNormalized = Vector3.normalize(axis);
        const angle = Math.acos(dot);

        // Create quaternion from axis-angle
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        rotationQuat.setComponents(
          axisNormalized.x * sinHalfAngle,
          axisNormalized.y * sinHalfAngle,
          axisNormalized.z * sinHalfAngle,
          Math.cos(halfAngle)
        );
      }

      this.__capsuleEntity.localRotation = rotationQuat;
    }
  }

  _destroy(): void {
    if (Is.exist(this.__topEntity)) {
      this.__topEntity._destroy();
    }
    this.__capsuleEntity = undefined;
  }

  /**
   * Gets the capsule collider being visualized.
   * @returns The capsule collider instance
   */
  get capsuleCollider(): CapsuleCollider {
    return this.__capsuleCollider;
  }
}
