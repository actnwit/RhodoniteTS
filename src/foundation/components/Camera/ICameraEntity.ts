import { Component } from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import { CameraComponent } from './CameraComponent';

export interface ICameraEntityMethods {
  getCamera(): CameraComponent;
}
