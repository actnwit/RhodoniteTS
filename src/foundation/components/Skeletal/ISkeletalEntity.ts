import { Component } from '../../core/Component';
import { EntityUID } from '../../../types/CommonTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import { MixinBase } from '../../../types/TypeGenerators';
import type { SkeletalComponent } from './SkeletalComponent';

export interface ISkeletalEntityMethods {
  getSkeletal(): SkeletalComponent;
}
