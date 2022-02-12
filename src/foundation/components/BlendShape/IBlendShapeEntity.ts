import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import BlendShapeComponent from '../BlendShape/BlendShapeComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';

export interface IBlendShapeEntityMethods {
  getBlendShape(): BlendShapeComponent;
}
