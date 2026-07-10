import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IVector3 } from '../math/IVector';

export interface CharacterControllerOptions {
  radius?: number;
  height?: number;
  contactOffset?: number;
  maxStepHeight?: number;
  minStepWidth?: number;
  maxSlopeClimbAngle?: number;
  minSlopeSlideAngle?: number;
  snapToGroundDistance?: number;
  gravity?: number;
  jumpSpeed?: number;
  maxDeltaTime?: number;
  applyImpulsesToDynamicBodies?: boolean;
}

export interface CharacterControllerStrategy {
  setup(entity: ISceneGraphEntity, options?: CharacterControllerOptions): void;
  setDesiredHorizontalVelocity(velocity: IVector3): void;
  requestJump(): void;
  teleport(position: IVector3): void;
  readonly isGrounded: boolean;
  readonly computedMovement: IVector3;
  enabled: boolean;
  destroy(): void;
}
