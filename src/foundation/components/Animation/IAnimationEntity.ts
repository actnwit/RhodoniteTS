import { EntityUID } from '../../../types/CommonTypes';
import { MixinBase } from '../../../types/TypeGenerators';
import type { AnimationComponent } from '../../components/Animation/AnimationComponent';
import { Component } from '../../core/Component';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export interface IAnimationEntityMethods {
  getAnimation(): AnimationComponent;
}
