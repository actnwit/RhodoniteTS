import SceneGraphComponent from './SceneGraphComponent';
import {IMatrix44} from '../../math/IMatrix';

export interface ISceneGraphEntityMethods {
  getSceneGraph(): SceneGraphComponent;
  worldMatrix: IMatrix44;
  worldMatrixInner: IMatrix44;
  addChild(sg: SceneGraphComponent): void;
  children: SceneGraphComponent[];
  removeChild(sg: SceneGraphComponent): void;
}
