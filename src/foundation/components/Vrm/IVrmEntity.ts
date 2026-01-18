import { IMatrix22 } from '../../math/IMatrix';
import { IQuaternion } from '../../math/IQuaternion';
import { IVector3 } from '../../math/IVector';
import type { VrmComponent } from './VrmComponent';

export interface IVrmEntityMethods {
  getVrm(): VrmComponent;
}
