import type { SceneGraphComponent } from './SceneGraphComponent';
import type { IMatrix44 } from '../../math/IMatrix';
import type { IVector3 } from '../../math/IVector';
import type { IQuaternion } from '../../math/IQuaternion';

export interface ISceneGraphEntityMethods {
  getSceneGraph(): SceneGraphComponent;
  parent?: SceneGraphComponent;
  matrix: IMatrix44;
  matrixInner: IMatrix44;
  position: IVector3;
  positionRest: IVector3;
  scale: IVector3;
  eulerAngles: IVector3;
  rotation: IQuaternion;
  rotationRest: IQuaternion;

  addChild(sg: SceneGraphComponent): void;
  children: SceneGraphComponent[];
  removeChild(sg: SceneGraphComponent): void;
}
