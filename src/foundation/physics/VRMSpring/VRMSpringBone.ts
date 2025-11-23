import type { SceneGraphComponent } from '../../components';
import { RnObject } from '../../core/RnObject';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { type IMatrix44, IVector3, Matrix44, MutableMatrix44, MutableVector3, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';

/**
 * VRM Spring Bone implementation for physics-based bone animation.
 * This class handles the physics simulation of spring bones commonly used in VRM models
 * for secondary animation like hair, clothes, and accessories.
 */
export class VRMSpringBone extends RnObject {
  /** The stiffness force that controls how quickly the bone returns to its rest position */
  stiffnessForce = 1.0;

  /** The power of gravity affecting the bone movement */
  gravityPower = 0;

  /** The direction vector of gravity force */
  gravityDir = Vector3.fromCopyArray([0, -1.0, 0]);

  /** The drag force that dampens the bone movement */
  dragForce = 0.4;

  /** The radius used for collision detection */
  hitRadius = 0.02;

  /** The scene graph entity node that this spring bone is attached to */
  node: ISceneGraphEntity;

  /** Current tail position in world space coordinates */
  currentTail: MutableVector3 = MutableVector3.zero(); // In World Space

  /** Previous tail position in world space coordinates */
  prevTail: MutableVector3 = MutableVector3.zero(); // In World Space

  /** The bone axis direction in local space coordinates */
  boneAxis: Vector3 = Vector3.zero(); // In Local Space

  /** The length of the bone in world space units */
  boneLength = 0;

  /** The initial local position of the child bone */
  initialLocalChildPosition: Vector3 = Vector3.zero();

  /** Flag indicating whether the spring bone has been initialized */
  initialized = false;

  /** Temporary vector for internal calculations */
  private static __tmp_vec3_0 = MutableVector3.zero();

  /** Temporary vector for internal calculations */
  private static __tmp_vec3_1 = MutableVector3.zero();

  /** Temporary zero vector for internal calculations */
  private static __tmp_vec3_2_zero = Vector3.zero();

  /** Temporary vector for internal calculations */
  private static __tmp_vec3_3 = MutableVector3.zero();

  private static __tmp_mat44_0 = MutableMatrix44.identity();

  /**
   * Creates a new VRM Spring Bone instance.
   * @param node - The scene graph entity node to attach this spring bone to
   */
  constructor(node: ISceneGraphEntity) {
    super();
    this.node = node;
  }

  /**
   * Initializes the spring bone with default values and calculates initial positions.
   * This method should be called once before starting the physics simulation.
   * @param center - Optional center component for coordinate transformation
   */
  setup(center?: SceneGraphComponent) {
    if (!this.initialized) {
      this.node.getTransform()._backupTransformAsRest();
      const children = this.node.getSceneGraph().children;
      if (children.length > 0) {
        this.initialLocalChildPosition = children[0].entity.getTransform().localPosition;
        if (this.initialLocalChildPosition.length() === 0) {
          this.initialLocalChildPosition = Vector3.fromCopyArray([0, -0.07, 0]);
        }
      } else {
        const localPosition =
          this.node.getTransform().localPosition.length() > 0
            ? this.node.getTransform().localPosition
            : Vector3.fromCopyArray([0, -1, 0]);
        this.initialLocalChildPosition = Vector3.multiply(Vector3.normalize(localPosition), 0.07);
      }

      const initialWorldChildPosition = this.node.matrixInner.multiplyVector3(this.initialLocalChildPosition);

      const currentTail =
        center != null ? center.getLocalPositionOf(initialWorldChildPosition) : initialWorldChildPosition;
      this.currentTail.copyComponents(currentTail);
      this.prevTail.copyComponents(this.currentTail);
      const localPosition =
        this.initialLocalChildPosition.length() > 0
          ? this.initialLocalChildPosition
          : Vector3.fromCopyArray([0, -0.07, 0]);
      this.boneAxis = Vector3.normalize(localPosition);

      this.initialized = true;
    }
  }

  /**
   * Gets the transformation matrix from center space to world space.
   * @param center - Optional center component for coordinate transformation
   * @returns The transformation matrix from center to world space
   */
  _getMatrixCenterToWorld(center?: SceneGraphComponent): IMatrix44 {
    const mat = center != null ? center.matrixInner : Matrix44.identity();
    return mat;
  }

  /**
   * Gets the transformation matrix from world space to center space.
   * @param center - Optional center component for coordinate transformation
   * @returns The transformation matrix from world to center space
   */
  _getMatrixWorldToCenter(center?: SceneGraphComponent): IMatrix44 {
    const mat = center != null ? Matrix44.invert(center.matrixInner) : Matrix44.identity();
    return mat;
  }

  /**
   * Calculates the bone length in world space coordinates.
   * This method updates the boneLength property based on the current world positions
   * of the bone and its child (or estimated child position).
   */
  _calcWorldSpaceBoneLength(): void {
    const v3A = this.node.getSceneGraph().matrixInner.getTranslateTo(VRMSpringBone.__tmp_vec3_0);
    let v3B = VRMSpringBone.__tmp_vec3_2_zero;
    const children = this.node.getSceneGraph().children;
    if (children.length > 0) {
      v3B = children[0].matrixInner.getTranslateTo(VRMSpringBone.__tmp_vec3_1);
    } else {
      // v3B = this.node.getSceneGraph().matrixInner.multiplyVector3(this.initialLocalChildPosition);
      v3B = Vector3.multiplyMatrix4(this.initialLocalChildPosition, this.node.getSceneGraph().matrixInner);
    }

    this.boneLength = Vector3.subtractTo(v3A, v3B, VRMSpringBone.__tmp_vec3_3).length();
  }
}
