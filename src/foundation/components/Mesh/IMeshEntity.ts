import {EntityUID} from '../../../types/CommonTypes';
import {MixinBase} from '../../../types/TypeGenerators';
import { Component } from '../../core/Component';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import { MeshComponent } from './MeshComponent';

export interface IMeshEntityMethods {
  getMesh(): MeshComponent;
}
