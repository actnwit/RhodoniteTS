import { VRMSpring } from "./VRMSpring";

export interface PhysicsStrategy {
  update(): void;
  setSpring(spring: VRMSpring): void;
}
