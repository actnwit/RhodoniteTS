import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import { Component } from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import { LightComponent } from './LightComponent';

export interface ILightEntityMethods {
  getLight(): LightComponent;
}
