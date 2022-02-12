import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import TransformComponent from './TransformComponent';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';

export interface ITransformEntityMethods {
  getTransform(): TransformComponent;
}
