import { SceneGraphComponent } from './SceneGraphComponent';
import { IMatrix44 } from '../../math/IMatrix';
import { IVector3 } from '../../math/IVector';
import { IQuaternion } from '../../math/IQuaternion';
export interface ISceneGraphEntityMethods {
    getSceneGraph(): SceneGraphComponent;
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
