import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import type { Engine } from '../../system/Engine';
import { type EventSubscriberIndex } from '../../system/EventPubSub';
import type { ComponentToComponentMethods } from '../ComponentTypes';
export type TriggerEventType = 'enter' | 'stay' | 'exit';
export interface TriggerEvent {
    type: TriggerEventType;
    triggerComponent: TriggerComponent;
    triggerEntity: IEntity;
    otherEntity: IEntity;
    sensorBindingId: number;
    otherBindingId?: number;
}
/** Groups one or more physics sensors into a logical trigger volume. */
export declare class TriggerComponent extends Component {
    private static __sensorOwners;
    private static __components;
    private __pubsub;
    private __sensorKeys;
    private __activeOverlaps;
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): 19;
    get componentTID(): ComponentTID;
    subscribe(type: TriggerEventType, handler: (event: TriggerEvent) => void): EventSubscriberIndex;
    unsubscribe(type: TriggerEventType, index: EventSubscriberIndex): void;
    get activeOverlapCount(): number;
    /** @internal Associates a PhysicsComponent binding with this logical trigger. */
    _registerSensorBinding(physicsEntityUid: EntityUID, bindingId: number): void;
    /** @internal Removes ownership when a sensor binding is permanently deleted. */
    static _unregisterSensorBinding(engine: Engine, physicsEntityUid: EntityUID, sensorBindingId: number): void;
    /** @internal Called by the Rapier event bridge. */
    static _processOverlap(engine: Engine, sensorEntityUid: EntityUID, sensorBindingId: number, otherEntity: IEntity, otherBindingId: number | undefined, started: boolean, otherColliderHandle?: number): void;
    /** @internal Emits one Stay event per active logical overlap after each physics step. */
    static _publishStayEvents(): void;
    /** @internal Ends overlaps owned by a sensor collider that is being removed or rebuilt. */
    static _deactivateSensorBinding(engine: Engine, physicsEntityUid: EntityUID, sensorBindingId: number): void;
    /** @internal Ends overlaps in which a collider being removed is the non-owning side. */
    static _deactivateOtherBinding(otherEntity: IEntity, otherBindingId: number | undefined, otherColliderHandle?: number): void;
    private __publish;
    private static __sensorKey;
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
