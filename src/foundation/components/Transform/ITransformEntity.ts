import {IVector3} from '../../math/IVector';
import {IQuaternion} from '../../math/IQuaternion';
import {IMatrix22} from '../../math/IMatrix';
import { TransformComponent } from './TransformComponent';

export interface ITransformEntityMethods {
  getTransform(): TransformComponent;
  translate: IVector3;
  scale: IVector3;
  rotate: IVector3;
  quaternion: IQuaternion;
  matrix: IMatrix22;
  translateInner: IVector3;
  scaleInner: IVector3;
  rotateInner: IVector3;
  quaternionInner: IQuaternion;
  matrixInner: IMatrix22;
  translateRest: IVector3;
  scaleRest: IVector3;
  rotateRest: IVector3;
  quaternionRest: IQuaternion;
  matrixRest: IMatrix22;
  translateRestInner: IVector3;
  scaleRestInner: IVector3;
  rotateRestInner: IVector3;
  quaternionRestInner: IQuaternion;
  matrixRestInner: IMatrix22;
}
