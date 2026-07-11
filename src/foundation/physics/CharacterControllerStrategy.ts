import type { IEntity } from '../core/Entity';
import type { ShapeInstance } from '../geometry/Shape';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { IVector3 } from '../math/IVector';

export interface CharacterGroundContact {
  entity: IEntity;
  bindingId?: number;
  position: IVector3;
  normal: IVector3;
  distance: number;
  slopeAngle: number;
  isWalkable: boolean;
}

export type CharacterMovementState = 'grounded' | 'rising' | 'falling' | 'landing' | 'sliding' | 'recovering';

export interface CharacterMotionState {
  state: CharacterMovementState;
  velocity: IVector3;
  horizontalSpeed: number;
  verticalSpeed: number;
  groundedDuration: number;
  airborneDuration: number;
  stateElapsedTime: number;
  landingImpactSpeed: number;
  groundContact?: CharacterGroundContact;
}

export interface CharacterControllerOptions {
  /** Index of the capsule in the entity's ShapeComponent. */
  shapeIndex?: number;
  /** @deprecated Define a capsule in ShapeComponent instead. This value is the capsule radius. */
  radius?: number;
  /** @deprecated Define a capsule in ShapeComponent instead. This value is the capsule's total height. */
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
  groundProbeDistance?: number;
  groundProbeStartOffset?: number;
  groundCollisionGroup?: number;
  groundCollisionMask?: number;
  groundProbeRadius?: number;
  normalNudgeFactor?: number;
  stuckRecoveryEnabled?: boolean;
  stuckRecoveryFrameCount?: number;
  stuckRecoveryDistance?: number;
}

export interface CharacterControllerStrategy {
  setup(entity: ISceneGraphEntity, shape: ShapeInstance, options?: CharacterControllerOptions): void;
  setDesiredHorizontalVelocity(velocity: IVector3): void;
  requestJump(): void;
  teleport(position: IVector3): void;
  readonly isGrounded: boolean;
  readonly computedMovement: IVector3;
  readonly groundContact: CharacterGroundContact | undefined;
  readonly isRecovering: boolean;
  readonly motionState: CharacterMotionState;
  enabled: boolean;
  destroy(): void;
}
