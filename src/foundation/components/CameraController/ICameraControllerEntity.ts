import Component from '../../core/Component';
import {EntityUID} from '../../../types/CommonTypes';
import {WellKnownComponentTIDs} from '../WellKnownComponentTIDs';
import {MixinBase} from '../../../types/TypeGenerators';
import CameraControllerComponent from './CameraControllerComponent';

export interface ICameraControllerEntityMethods {
  getCameraController(): CameraControllerComponent;
}
