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
} from '../../physics/CharacterControllerStrategy';
import { RapierPhysicsStrategy } from '../../physics/Rapier/RapierPhysicsStrategy';
import type { Engine } from '../../system/Engine';
import { AnimationComponent } from '../Animation/AnimationComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/** ECS component for a backend-neutral kinematic character controller. */
export class CharacterControllerComponent extends Component {
  private __strategy?: CharacterControllerStrategy;
  private readonly __zeroMovement = Vector3.zero();

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

  $logic(): void {}

  setup(strategy: CharacterControllerStrategy, options: CharacterControllerOptions = {}): void {
    if (this.__strategy != null) {
      throw new Error('CharacterControllerComponent has already been set up.');
    }
    strategy.setup(this.entity as ISceneGraphEntity, options);
    this.__strategy = strategy;
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
