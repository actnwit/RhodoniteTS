import { VRMSpring } from './VRMSpring/VRMSpring';

export interface PhysicsStrategy {
  update(): void;
  setSpring(spring: VRMSpring): void;
}
