import type { IMatrix44 } from '../../math/IMatrix';
import type { IQuaternion } from '../../math/IQuaternion';
import type { IVector3 } from '../../math/IVector';
import type { TransformComponent } from './TransformComponent';

export interface ITransformEntityMethods {
  getTransform(): TransformComponent;
  localPosition: IVector3;
  localScale: IVector3;
  localEulerAngles: IVector3;
  localRotation: IQuaternion;
  localMatrix: IMatrix44;
  localPositionInner: IVector3;
  localScaleInner: IVector3;
  localEulerAnglesInner: IVector3;
  localRotationInner: IQuaternion;
  localMatrixInner: IMatrix44;
  localPositionRest: IVector3;
  localScaleRest: IVector3;
  localEulerAnglesRest: IVector3;
  localRotationRest: IQuaternion;
  localMatrixRest: IMatrix44;
  localPositionRestInner: IVector3;
  localScaleRestInner: IVector3;
  localEulerAnglesRestInner: IVector3;
  localRotationRestInner: IQuaternion;
  localMatrixRestInner: IMatrix44;
}
