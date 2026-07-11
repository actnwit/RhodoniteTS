import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import type { ISceneGraphEntity } from '../../helpers/EntityHelper';
import { type IVector3, Vector3 } from '../../math';
import { Time } from '../../misc/Time';
import type {
  CharacterControllerOptions,
  CharacterControllerStrategy,
  CharacterGroundContact,
  CharacterMotionState,
} from '../../physics/CharacterControllerStrategy';
import { RapierPhysicsStrategy } from '../../physics/Rapier/RapierPhysicsStrategy';
import type { Engine } from '../../system/Engine';
import { EventPubSub, type EventSubscriberIndex } from '../../system/EventPubSub';
import { AnimationComponent } from '../Animation/AnimationComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { ShapeComponent } from '../Shape/ShapeComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

export type CharacterControllerEventType = 'stateChanged' | 'landed';

export interface CharacterControllerStateChangedEvent {
  type: 'stateChanged';
  component: CharacterControllerComponent;
  entity: IEntity;
  previous: CharacterMotionState;
  current: CharacterMotionState;
}

export interface CharacterControllerLandedEvent {
  type: 'landed';
  component: CharacterControllerComponent;
  entity: IEntity;
  impactSpeed: number;
  groundContact?: CharacterGroundContact;
}

export type CharacterControllerEvent = CharacterControllerStateChangedEvent | CharacterControllerLandedEvent;

const initialMotionState: CharacterMotionState = {
  state: 'falling',
  velocity: Vector3.zero(),
  horizontalSpeed: 0,
  verticalSpeed: 0,
  groundedDuration: 0,
  airborneDuration: 0,
  stateElapsedTime: 0,
  landingImpactSpeed: 0,
};

/** ECS component for a backend-neutral kinematic character controller. */
export class CharacterControllerComponent extends Component {
  private __strategy?: CharacterControllerStrategy;
  private readonly __zeroMovement = Vector3.zero();
  private readonly __pubsub = new EventPubSub();
  private __lastObservedMotionState: CharacterMotionState = initialMotionState;

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID() {
    return WellKnownComponentTIDs.CharacterControllerComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.CharacterControllerComponentTID;
  }

  static common_$logic({ engine }: { engine: Engine }) {
    if (!AnimationComponent.getIsAnimating(engine)) {
      return;
    }
    RapierPhysicsStrategy.update(Time.timeAtProcessBeginMilliseconds, Time.intervalProcessBegin);
  }

  $logic(): void {
    if (this.__strategy == null || !this.__strategy.enabled) {
      return;
    }
    const current = this.__strategy.motionState;
    const previous = this.__lastObservedMotionState;
    if (current.state !== previous.state) {
      this.__pubsub.publishSync('stateChanged', {
        type: 'stateChanged',
        component: this,
        entity: this.entity,
        previous,
        current,
      } satisfies CharacterControllerStateChangedEvent);
      if (current.state === 'landing') {
        this.__pubsub.publishSync('landed', {
          type: 'landed',
          component: this,
          entity: this.entity,
          impactSpeed: current.landingImpactSpeed,
          groundContact: current.groundContact,
        } satisfies CharacterControllerLandedEvent);
      }
    }
    this.__lastObservedMotionState = current;
  }

  setup(strategy: CharacterControllerStrategy, options: CharacterControllerOptions = {}): void {
    if (this.__strategy != null) {
      throw new Error('CharacterControllerComponent has already been set up.');
    }
    const entity = this.entity as ISceneGraphEntity;
    const shapeComponent =
      entity.tryToGetShape() ?? this.__engine.entityRepository.addComponentToEntity(ShapeComponent, entity).getShape();
    let shapeIndex = options.shapeIndex;
    let shape = shapeIndex == null ? shapeComponent.getShape(0) : shapeComponent.getShape(shapeIndex);
    if (shape == null && shapeIndex == null) {
      const radius = options.radius ?? 0.3;
      const totalHeight = options.height ?? 1.6;
      if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(totalHeight) || totalHeight <= radius * 2) {
        throw new Error('Legacy character capsule height must be greater than twice its positive radius.');
      }
      shapeIndex = shapeComponent.addShape(
        {
          type: 'capsule',
          height: totalHeight - radius * 2,
          radiusBottom: radius,
          radiusTop: radius,
        },
        { position: Vector3.fromCopy3(0, totalHeight / 2, 0) }
      );
      shape = shapeComponent.getShape(shapeIndex);
    }
    if (shape == null) {
      throw new Error(`ShapeComponent does not contain character shape index ${shapeIndex}.`);
    }
    if (shape.shape.type !== 'capsule') {
      throw new Error('CharacterControllerComponent requires a capsule ShapeInstance.');
    }
    strategy.setup(entity, shape, options);
    this.__strategy = strategy;
    this.__lastObservedMotionState = strategy.motionState;
  }

  setDesiredHorizontalVelocity(velocity: IVector3): void {
    this.__strategy?.setDesiredHorizontalVelocity(velocity);
  }

  requestJump(): void {
    this.__strategy?.requestJump();
  }

  teleport(position: IVector3): void {
    if (this.__strategy == null) {
      throw new Error('CharacterControllerComponent.setup() must be called before teleport().');
    }
    this.__strategy.teleport(position);
  }

  get isGrounded(): boolean {
    return this.__strategy?.isGrounded ?? false;
  }

  get computedMovement(): IVector3 {
    return this.__strategy?.computedMovement ?? this.__zeroMovement;
  }

  /** Detailed ground information from the controller's foot probe. */
  get groundContact(): CharacterGroundContact | undefined {
    return this.__strategy?.groundContact;
  }

  /** True during a frame where obstacle-stuck recovery adjusted movement. */
  get isRecovering(): boolean {
    return this.__strategy?.isRecovering ?? false;
  }

  get motionState(): CharacterMotionState {
    return this.__strategy?.motionState ?? initialMotionState;
  }

  subscribe(type: 'stateChanged', handler: (event: CharacterControllerStateChangedEvent) => void): EventSubscriberIndex;
  subscribe(type: 'landed', handler: (event: CharacterControllerLandedEvent) => void): EventSubscriberIndex;
  subscribe(
    type: CharacterControllerEventType,
    handler: ((event: CharacterControllerStateChangedEvent) => void) | ((event: CharacterControllerLandedEvent) => void)
  ): EventSubscriberIndex {
    return this.__pubsub.subscribe(type, handler as (event: unknown) => void);
  }

  unsubscribe(type: CharacterControllerEventType, index: EventSubscriberIndex): void {
    this.__pubsub.unsubscribe(type, index);
  }

  set enabled(value: boolean) {
    if (this.__strategy != null) {
      this.__strategy.enabled = value;
    }
  }

  get enabled(): boolean {
    return this.__strategy?.enabled ?? false;
  }

  _destroy(): void {
    this.__strategy?.destroy();
    this.__strategy = undefined;
    this.__pubsub.unsubscribeAll('stateChanged');
    this.__pubsub.unsubscribeAll('landed');
    this.__lastObservedMotionState = initialMotionState;
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class CharacterControllerEntity extends (base.constructor as any) {
      getCharacterController() {
        return this.getComponentByComponentTID(
          WellKnownComponentTIDs.CharacterControllerComponentTID
        ) as CharacterControllerComponent;
      }
    }
    applyMixins(base, CharacterControllerEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
