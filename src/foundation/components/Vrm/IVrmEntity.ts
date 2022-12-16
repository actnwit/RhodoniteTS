import { IVector3 } from '../../math/IVector';
import { IQuaternion } from '../../math/IQuaternion';
import { IMatrix22 } from '../../math/IMatrix';
import { VrmComponent } from './VrmComponent';

export interface IVrmEntityMethods {
  getVrm(): VrmComponent;
}
