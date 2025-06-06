import { EntityUID } from '../../../types/CommonTypes';
import { MixinBase } from '../../../types/TypeGenerators';
import { Component } from '../../core/Component';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import type { CameraComponent } from './CameraComponent';

export interface ICameraEntityMethods {
  getCamera(): CameraComponent;
}
