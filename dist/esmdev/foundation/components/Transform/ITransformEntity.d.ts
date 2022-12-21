import { IVector3 } from '../../math/IVector';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix22 } from '../../math/IMatrix';
import { TransformComponent } from './TransformComponent';
export interface ITransformEntityMethods {
    getTransform(): TransformComponent;
    localPosition: IVector3;
    localScale: IVector3;
    localEulerAngles: IVector3;
    localRotation: IQuaternion;
    localMatrix: IMatrix22;
    localPositionInner: IVector3;
    localScaleInner: IVector3;
    localEulerAnglesInner: IVector3;
    localRotationInner: IQuaternion;
    localMatrixInner: IMatrix22;
    localPositionRest: IVector3;
    localScaleRest: IVector3;
    localEulerAnglesRest: IVector3;
    localRotationRest: IQuaternion;
    localMatrixRest: IMatrix22;
    localPositionRestInner: IVector3;
    localScaleRestInner: IVector3;
    localEulerAnglesRestInner: IVector3;
    localRotationRestInner: IQuaternion;
    localMatrixRestInner: IMatrix22;
}
