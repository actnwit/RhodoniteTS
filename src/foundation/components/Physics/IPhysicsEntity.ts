import { EntityUID } from '../../../types/CommonTypes';
import { MixinBase } from '../../../types/TypeGenerators';
import { Component } from '../../core/Component';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import type { PhysicsComponent } from './PhysicsComponent';

export interface IPhysicsEntityMethods {
  getPhysics(): PhysicsComponent;
}
