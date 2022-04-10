import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import Component from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import { MeshRendererComponent } from './MeshRendererComponent';

export interface IMeshRendererEntityMethods {
  getMeshRenderer(): MeshRendererComponent;
}
