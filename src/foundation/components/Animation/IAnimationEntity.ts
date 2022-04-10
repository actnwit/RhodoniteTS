import { Component } from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import { AnimationComponent } from '../../components/Animation/AnimationComponent';

export interface IAnimationEntityMethods {
  getAnimation(): AnimationComponent;
}
