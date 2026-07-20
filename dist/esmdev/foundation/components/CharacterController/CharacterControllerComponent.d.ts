import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type IVector3 } from '../../math';
import type { CharacterControllerOptions, CharacterControllerStrategy, CharacterGroundContact, CharacterMotionState } from '../../physics/CharacterControllerStrategy';
import type { Engine } from '../../system/Engine';
import { type EventSubscriberIndex } from '../../system/EventPubSub';
import type { ComponentToComponentMethods } from '../ComponentTypes';
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
/** ECS component for a backend-neutral kinematic character controller. */
export declare class CharacterControllerComponent extends Component {
    private __strategy?;
    private readonly __zeroMovement;
    private readonly __pubsub;
    private __lastObservedMotionState;
    private __desiredHorizontalSpeed?;
    private __generatedShapeComponent?;
    private __generatedShapeIndex?;
    private __ownsGeneratedShapeComponent;
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): 17;
    get componentTID(): ComponentTID;
    static common_$logic({ engine }: {
        engine: Engine;
    }): void;
    $logic(): void;
    setup(strategy: CharacterControllerStrategy, options?: CharacterControllerOptions): void;
    setDesiredHorizontalVelocity(velocity: IVector3): void;
    /**
     * Horizontal speed requested through {@link setDesiredHorizontalVelocity}, before
     * collision and step correction. It is undefined until a desired velocity is supplied.
     */
    get desiredHorizontalSpeed(): number | undefined;
    requestJump(): void;
    teleport(position: IVector3): void;
    get isGrounded(): boolean;
    get computedMovement(): IVector3;
    /** Detailed ground information from the controller's foot probe. */
    get groundContact(): CharacterGroundContact | undefined;
    /** True during a frame where obstacle-stuck recovery adjusted movement. */
    get isRecovering(): boolean;
    get motionState(): CharacterMotionState;
    subscribe(type: 'stateChanged', handler: (event: CharacterControllerStateChangedEvent) => void): EventSubscriberIndex;
    subscribe(type: 'landed', handler: (event: CharacterControllerLandedEvent) => void): EventSubscriberIndex;
    unsubscribe(type: CharacterControllerEventType, index: EventSubscriberIndex): void;
    set enabled(value: boolean);
    get enabled(): boolean;
    _destroy(): void;
    private __cleanupGeneratedShape;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
