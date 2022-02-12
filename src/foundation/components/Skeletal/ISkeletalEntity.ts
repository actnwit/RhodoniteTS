import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import SkeletalComponent from './SkeletalComponent';

export interface ISkeletalEntityMethods {
  getSkeletal(): SkeletalComponent;
}
