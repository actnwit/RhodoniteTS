import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import SceneGraphComponent from './SceneGraphComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import {Is} from '../../misc/Is';
import {IMatrix44} from '../../math/IMatrix';
import {IGroupEntity} from '../../helpers/EntityHelper';

export interface ISceneGraphEntityMethods {
  getSceneGraph(): SceneGraphComponent;
  worldMatrix: IMatrix44;
  worldMatrixInner: IMatrix44;
}
