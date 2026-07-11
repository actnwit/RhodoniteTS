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
} from '../../physics/CharacterControllerStrategy';
import { RapierPhysicsStrategy } from '../../physics/Rapier/RapierPhysicsStrategy';
import type { Engine } from '../../system/Engine';
import { AnimationComponent } from '../Animation/AnimationComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { ShapeComponent } from '../Shape/ShapeComponent';
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
