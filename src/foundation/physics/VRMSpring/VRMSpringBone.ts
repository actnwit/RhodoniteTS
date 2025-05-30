import { SceneGraphComponent } from '../../components';
import { RnObject } from '../../core/RnObject';
import { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { IMatrix44, IVector3, Matrix44, MutableVector3, Quaternion } from '../../math';
import { Vector3 } from '../../math/Vector3';

export class VRMSpringBone extends RnObject {
  stiffnessForce = 1.0;
  gravityPower = 0;
  gravityDir = Vector3.fromCopyArray([0, -1.0, 0]);
  dragForce = 0.4;
  hitRadius = 0.02;
  node: ISceneGraphEntity;

  currentTail: Vector3 = Vector3.zero(); // In World Space
  prevTail: Vector3 = Vector3.zero(); // In World Space
  boneAxis: Vector3 = Vector3.zero(); // In Local Space
  boneLength = 0;
  initialLocalChildPosition: Vector3 = Vector3.zero();

  initialized = false;

  private static __tmp_vec3_0 = MutableVector3.zero();
  private static __tmp_vec3_1 = MutableVector3.zero();
  private static __tmp_vec3_2_zero = Vector3.zero();

  constructor(node: ISceneGraphEntity) {
    super();
    this.node = node;
  }

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
        this.initialLocalChildPosition = Vector3.multiply(
          Vector3.normalize(localPosition),
          0.07
        );
      }

      const initialWorldChildPosition = this.node.matrixInner.multiplyVector3(
        this.initialLocalChildPosition
      );
      this.currentTail =
        center != null
          ? center.getLocalPositionOf(initialWorldChildPosition)
          : initialWorldChildPosition;
      this.prevTail = this.currentTail.clone();
      const localPosition =
        this.initialLocalChildPosition.length() > 0
          ? this.initialLocalChildPosition
          : Vector3.fromCopyArray([0, -0.07, 0]);
      this.boneAxis = Vector3.normalize(localPosition);

      this.initialized = true;
    }
  }

  _getMatrixCenterToWorld(center?: SceneGraphComponent): IMatrix44 {
    const mat = center != null ? center.matrixInner : Matrix44.identity();
    return mat;
  }

  _getMatrixWorldToCenter(center?: SceneGraphComponent): IMatrix44 {
    const mat = center != null ? Matrix44.invert(center.matrixInner) : Matrix44.identity();
    return mat;
  }

  _calcWorldSpaceBoneLength(): void {
    const v3A = this.node.getSceneGraph().matrixInner.getTranslateTo(VRMSpringBone.__tmp_vec3_0);
    let v3B = VRMSpringBone.__tmp_vec3_2_zero;
    const children = this.node.getSceneGraph().children;
    if (children.length > 0) {
      v3B = children[0].matrixInner.getTranslateTo(VRMSpringBone.__tmp_vec3_1);
    } else {
      // v3B = this.node.getSceneGraph().matrixInner.multiplyVector3(this.initialLocalChildPosition);
      v3B = Vector3.multiplyMatrix4(
        this.initialLocalChildPosition,
        this.node.getSceneGraph().matrixInner
      );
    }

    this.boneLength = Vector3.subtract(v3A, v3B).length();
  }
}
